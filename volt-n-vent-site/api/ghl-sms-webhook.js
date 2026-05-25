/**
 * HTTPS bridge: GHL → n8n
 * If GHL sends empty contact_id/message_body (common with AI-built workflows),
 * we recover the latest inbound SMS from GHL API automatically.
 */
const N8N_URL =
  process.env.N8N_SMS_WEBHOOK_URL ||
  'http://143.198.227.200:5678/webhook/volt-n-vent-inbound-sms';

const GHL_TOKEN = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || '';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || '81uoqXcdjO6CKRFIIuw6';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

async function logHit(payload, status) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/webhook_hits`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        source: 'ghl',
        payload_keys: Object.keys(payload || {}),
        contact_id: payload?.contact_id || payload?.contactId || null,
        message_body: payload?.message_body ? String(payload.message_body).slice(0, 80) : null,
        status,
      }),
    });
  } catch {
    /* optional */
  }
}

async function recoverLatestInbound(locationId, token) {
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28' };
  const maxAgeMs = 5 * 60 * 1000;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));

    const res = await fetch(
      `https://services.leadconnectorhq.com/conversations/search?locationId=${encodeURIComponent(locationId)}&limit=30`,
      { headers }
    );
    if (!res.ok) continue;

    const data = await res.json();
    const now = Date.now();
    const hit = (data.conversations || [])
      .filter((c) => c.lastMessageDirection === 'inbound')
      .filter((c) => now - Number(c.lastMessageDate) < maxAgeMs)
      .sort((a, b) => Number(b.lastMessageDate) - Number(a.lastMessageDate))[0];

    if (hit) {
      return {
        contact_id: hit.contactId,
        message_body: hit.lastMessageBody,
        conversation_id: hit.id,
        location_id: locationId,
        client_slug: 'volt-n-vent',
        message_type: 'SMS',
        _recovered: true,
      };
    }
  }
  return null;
}

function normalizeGhlEvent(payload) {
  if (payload?.type === 'InboundMessage') {
    const mt = String(payload.messageType || payload.messageTypeString || '').toUpperCase();
    if (mt.includes('SMS') && !mt.includes('CALL') && !mt.includes('VOICEMAIL')) {
      return {
        client_slug: 'volt-n-vent',
        contact_id: payload.contactId,
        message_body: payload.body,
        location_id: payload.locationId,
        conversation_id: payload.conversationId,
        message_type: 'SMS',
        phone: payload.from,
      };
    }
  }
  return payload;
}

async function enrichPayload(payload) {
  payload = normalizeGhlEvent(payload);
  const contactId = pick(payload, 'contact_id', 'contactId');
  const messageBody = pick(payload, 'message_body', 'messageBody', 'body', 'message');

  if (contactId && messageBody) return payload;
  if (!GHL_TOKEN || !GHL_LOCATION_ID) return payload;

  const recovered = await recoverLatestInbound(
    pick(payload, 'location_id', 'locationId') || GHL_LOCATION_ID,
    GHL_TOKEN
  );
  if (!recovered) return payload;

  return {
    ...payload,
    client_slug: pick(payload, 'client_slug') || 'volt-n-vent',
    contact_id: contactId || recovered.contact_id,
    message_body: messageBody || recovered.message_body,
    conversation_id: pick(payload, 'conversation_id', 'conversationId') || recovered.conversation_id,
    location_id: pick(payload, 'location_id', 'locationId') || recovered.location_id,
    message_type: pick(payload, 'message_type', 'messageType') || 'SMS',
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let last = null;
    if (url && key) {
      try {
        const r = await fetch(`${url}/rest/v1/webhook_hits?order=created_at.desc&limit=1`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        const rows = await r.json();
        last = rows[0] || null;
      } catch {
        /* ignore */
      }
    }
    return res.status(200).json({
      ok: true,
      service: 'Volt N Vent Alex SMS bridge',
      forward: N8N_URL,
      ghl_recovery: Boolean(GHL_TOKEN && GHL_LOCATION_ID),
      last_ghl_hit: last,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = { raw_body: payload };
    }
  }
  if (!payload || typeof payload !== 'object') payload = {};

  try {
    const enriched = await enrichPayload(payload);
    const upstream = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    });
    const text = await upstream.text();
    const recovered = enriched !== payload || enriched._recovered;
    await logHit(enriched, upstream.ok ? (recovered ? 'ok_recovered' : 'ok') : `n8n_${upstream.status}`);

    let body;
    try {
      body = text ? JSON.parse(text) : { ok: true };
    } catch {
      body = { ok: upstream.ok, raw: text };
    }
    return res.status(upstream.ok ? 200 : upstream.status).json(body);
  } catch (err) {
    await logHit(payload, 'error');
    return res.status(502).json({ ok: false, error: String(err.message || err) });
  }
};
