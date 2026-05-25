const j = $input.first().json;
const session = $('Start Session').first().json;
const history = Array.isArray(j.chat_history) ? j.chat_history : [];
const priorFromHistory = history.filter(h => h.role === 'assistant').length;
const priorAssistant = Math.max(Number(session.prior_assistant_count ?? 0), priorFromHistory);
const assistantMsgs = history.filter(h => h.role === 'assistant').map(h => String(h.content || ''));
const assistantBlob = assistantMsgs.join(' ').toLowerCase();
const threadBlob = history.map(h => String(h.content || '')).join(' ').toLowerCase();
const empathyUsed = /sorry to hear|ah man|that's rough|must be frustrating|sorry about that|sorry youre dealing/.test(assistantBlob);
const heyUsed = assistantMsgs.some(t => /^hey[,!\s]/i.test(t.trim()));
const userText = String(j.message_body || '').toLowerCase().trim();

const wellnessContext = /wellness|29\.95|\$29|\$30|checkup|check-up|preventative visit|wellness check/.test(threadBlob);
const asksWhyPay = /why (do i|would i|should i) pay|why.*(29|pay|fee|charge)|what am i paying|why that (price|much)|what'?s the catch|why so cheap/.test(userText);
const asksWellnessDirect = /what (is|'?s) (a |an |the )?wellness|wellness check|hvac wellness|what do you check|what does the (check|visit)|what happens (on|during)|what'?s included|static pressure|what exactly|explain (the |this |your )?(wellness|check|offer|visit)|tell me (more )?about (the |this )?(wellness|check|offer|visit)/.test(userText);
const asksVagueFollowUp = wellnessContext && /what (is|does) (it|that|this)|what'?s that|what do you mean|tell me more|how does (it|that) work|what is that|whats that|what does that mean/.test(userText);
const asksComponents = /compressor|refrigerant|coil|condenser|duct|fan motor|lungs|blood pressure|what parts|what components|components do you/.test(userText);

const wellnessTopic = asksWhyPay
  ? 'why_pay'
  : asksComponents && (wellnessContext || asksWellnessDirect)
    ? 'hvac_components'
    : asksWellnessDirect || asksVagueFollowUp
      ? 'what_is_wellness_check'
      : null;

let wo = j.config?.wellness_offer;
if (typeof wo === 'string') { try { wo = JSON.parse(wo); } catch { wo = {}; } }
wo = wo || {};
const ku = wo.knowledge_usage || {};
const topic = wellnessTopic && ku.topics ? ku.topics[wellnessTopic] : null;

const leadNote = j.lead_source_asked
  ? 'They asked how we got their info — answer briefly per playbook only.'
  : 'Never mention lead sources or DNC unless they explicitly asked.';

let phaseNote = priorAssistant === 0
  ? 'FIRST reply: ultra casual. Sympathy ONCE max if they have a problem. No Hey required. No company intro unless outbound drip context.'
  : 'ONGOING: no Hey, no intro, no company name. Reply to NEW info only.';

let antiRepeat = '';
if (empathyUsed) antiRepeat += 'No more sympathy phrases (sorry to hear / ah man). ';
if (heyUsed || priorAssistant > 0) antiRepeat += 'Do NOT start with Hey — use Got it / Ok / Yeah / So or jump straight in. ';
if (priorAssistant > 0) antiRepeat += 'Do NOT re-ask answered questions. Do NOT repeat your last message. ';
if (/static pressure|blood pressure/.test(assistantBlob) && (asksWellnessDirect || asksVagueFollowUp)) {
  antiRepeat += 'You already explained static pressure — add a different detail (components, preventative, diagnostic) or keep shorter. ';
}

let triageHint = '';
if (/not cooling|no ac|no heat|won't cool|emergency|asap|103|110 degrees|burning smell|water leak|unit died/.test(userText)) {
  triageHint = 'TRIAGE: Service/emergency — help with their problem first. Do NOT pitch wellness. ';
} else if (/maintenance plan|annual service|tune.?up|routine maintenance|service my (ac|unit)|check my (ac|unit)/.test(userText)) {
  triageHint = 'TRIAGE: Maintenance/service request — book or qualify. Do NOT default to wellness drip script. ';
} else if (/quote|how much.*(install|replace|new unit)|financing|buy a (new )?system|good better best/.test(userText)) {
  triageHint = 'TRIAGE: Sales/quote — warm handoff, no job pricing in SMS. ';
} else if (/not interested|no thanks|stop texting|leave me alone|wrong number|don't text/.test(userText)) {
  triageHint = 'TRIAGE: Low interest — polite close, no pitch. ';
} else if (wellnessContext && /^(yes|yeah|yep|ok|okay|sure|interested|book|schedule)\b/.test(userText)) {
  triageHint = 'TRIAGE: Wellness campaign interest — book window, one question at a time. ';
}

let wellnessHint = '';
if (wellnessTopic) {
  wellnessHint = `IMPORTANT: They asked about ${wellnessTopic}. You MUST answer clearly in 1-2 casual sentences — never deflect. `;
  if (topic && Array.isArray(topic.fragments)) {
    wellnessHint += `Use 1-2 of these ideas (paraphrase, do NOT dump all): ${topic.fragments.slice(0, 6).join(' | ')}\\n`;
  }
}

const preamble = `SMS rules (highest priority):\\n- ${phaseNote}\\n- ${triageHint}${antiRepeat}${wellnessHint}${leadNote}\\n- Sound human, casual, knowledgeable. Light humor ok. Usually 1-2 short sentences; up to ~160 chars if explaining something they asked.\\n`;

const msgs = [{ role: 'system', content: preamble + '\\n---\\n\\n' + (j.system_prompt || '') }];
for (const h of history) {
  if (h && h.role && h.content && String(h.content).trim()) {
    msgs.push({ role: h.role, content: String(h.content).trim() });
  }
}
const last = msgs[msgs.length - 1];
if (!last || last.role !== 'user' || last.content !== j.message_body) {
  msgs.push({ role: 'user', content: j.message_body });
}

const maxTok = wellnessTopic ? 160 : 80;
const body = {
  model: j.model || 'gpt-4.1-mini',
  temperature: j.temperature || 0.6,
  max_tokens: maxTok,
  messages: msgs,
};

return [{ json: { ...j, openai_body: body, wellness_topic: wellnessTopic } }];
