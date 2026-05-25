/**
 * n8n Code node: GHL CRM Sync
 * Adds contact note + creates/updates Marketing Pipeline opportunity stage.
 * Requires GHL httpHeaderAuth credential on this node.
 */
const item = $input.first().json;
const configRow = item.config || $('Load Alex Config').first().json;
const config = Array.isArray(configRow) ? configRow[0] : configRow;
const meta = typeof config?.metadata === 'string' ? JSON.parse(config.metadata) : (config?.metadata || {});
const crm = meta.ghl_crm_sync || {};

if (!crm.enabled || !crm.pipeline_id) {
  return [{ json: { ...item, crm_sync: { skipped: true, reason: 'crm_not_configured' } } }];
}

const cred = await this.getCredentials('httpHeaderAuth');
const token = String(cred?.value || '').trim();
const headers = {
  Authorization: token.toLowerCase().startsWith('bearer') ? token : `Bearer ${token}`,
  Version: '2021-07-28',
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const locationId = crm.location_id || item.location_id || config.ghl_location_id;
const contactId = item.ghl_contact_id;
if (!contactId || !locationId) {
  return [{ json: { ...item, crm_sync: { skipped: true, reason: 'missing_contact_or_location' } } }];
}

const userText = String(item.message_body || '').toLowerCase();
const replyText = String(item.reply_text || '').toLowerCase();
const mode = item.conversation_mode || 'general_cs';
const route = item.route || 'ai';
const combined = `${userText} ${replyText}`;

function pickDispositionKey() {
  if (route === 'stop') return 'opt_out';
  if (/not interested|no thanks|wrong number|leave me alone|stop texting|dont text/.test(userText)) return 'not_interested';
  if (item.needs_handoff || mode === 'human_escalation' || route === 'handoff') return 'human_handoff';
  if (mode === 'sales_purchase') return 'sales_handoff';
  if (mode === 'emergency_dispatch' || /not cooling|no ac|no heat|emergency|asap|burning smell/.test(userText)) return 'urgent_service';
  if (/book|schedule|appointment|tomorrow|monday|tuesday|wednesday|thursday|friday|8-12|12-4|morning|afternoon/.test(combined)) return 'appointment_set';
  if (mode === 'wellness_drip' || /wellness|29\.95|\$29|\$30/.test(combined)) return 'wellness_interested';
  if (Number(item.prior_assistant_count || 0) === 0 && route === 'ai') return 'new_contact';
  return 'engaged';
}

const dispositionKey = pickDispositionKey();
const disposition = crm.dispositions?.[dispositionKey] || { label: dispositionKey };
const stageId = crm.stage_ids?.[dispositionKey] || crm.stage_ids?.engaged || crm.stage_ids?.new_contact || null;

const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
const noteBody = [
  `[${crm.note_prefix || 'Alex SMS'}] ${stamp}`,
  `Disposition: ${disposition.label || dispositionKey}`,
  `Mode: ${mode}${item.needs_handoff ? ' | Handoff: yes' : ''}`,
  `Customer: ${String(item.message_body || '').slice(0, 500)}`,
  `Alex: ${String(item.reply_text || '').slice(0, 500)}`,
].join('\n');

const results = { disposition_key: dispositionKey, disposition_label: disposition.label, stage_id: stageId, note: null, opportunity: null, errors: [] };

const http = this.helpers.httpRequest.bind(this);

try {
  const noteRes = await http({
    method: 'POST',
    url: `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
    headers,
    body: { body: noteBody },
    json: true,
  });
  results.note = noteRes?.note?.id || 'created';
} catch (e) {
  results.errors.push({ step: 'note', message: String(e.message || e) });
}

if (stageId) {
  try {
    const search = await http({
      method: 'GET',
      url: 'https://services.leadconnectorhq.com/opportunities/search',
      headers,
      qs: {
        location_id: locationId,
        contact_id: contactId,
        pipeline_id: crm.pipeline_id,
        limit: 1,
        status: 'all',
      },
      json: true,
    });
    const existing = (search?.opportunities || [])[0];
    const oppName = `SMS — ${disposition.label || dispositionKey}`;

    if (existing?.id) {
      await http({
        method: 'PUT',
        url: `https://services.leadconnectorhq.com/opportunities/${existing.id}`,
        headers,
        body: {
          pipelineId: crm.pipeline_id,
          pipelineStageId: stageId,
          name: oppName,
        },
        json: true,
      });
      results.opportunity = { action: 'updated', id: existing.id, stageId };
    } else {
      const created = await http({
        method: 'POST',
        url: 'https://services.leadconnectorhq.com/opportunities/',
        headers,
        body: {
          pipelineId: crm.pipeline_id,
          locationId,
          name: oppName,
          pipelineStageId: stageId,
          status: 'open',
          contactId,
        },
        json: true,
      });
      results.opportunity = { action: 'created', id: created?.opportunity?.id || created?.id, stageId };
    }
  } catch (e) {
    results.errors.push({ step: 'opportunity', message: String(e.message || e) });
  }
} else {
  results.errors.push({ step: 'opportunity', message: 'no_stage_id_mapped — run setup-ghl-marketing-pipeline.mjs' });
}

return [{ json: { ...item, crm_sync: results } }];
