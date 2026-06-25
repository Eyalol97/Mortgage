import mortgageBotPrompt from './mortgageBotPrompt.js';
import { GROQ_API_KEY, LLM_MODEL } from '../../shared/env.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_HISTORY_TOKENS = 6_000;
const CHARS_PER_TOKEN    = 4;

function _trimHistory(history, maxTokens = MAX_HISTORY_TOKENS) {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  let total = 0;
  const kept = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const len = typeof history[i].content === 'string' ? history[i].content.length : 0;
    if (total + len > maxChars) break;
    total += len;
    kept.unshift(history[i]);
  }

  while (kept.length > 0 && kept[0].role !== 'user') kept.shift();
  return kept;
}

function _errorReply(lang) {
  return lang === 'he'
    ? 'אירעה שגיאה בגישה לבסיס הידע. אנא נסה שוב.'
    : "I'm having trouble reaching my knowledge base right now. Please try again in a moment.";
}

async function respond(query, history, { advisory = false, lang = 'en' } = {}) {
  const systemPrompt = mortgageBotPrompt.getPrompt({ advisory, lang });

  const outputRules = 'OUTPUT RULES (follow exactly):'
    + '\n- Reply in 2-3 short sentences — be concise and direct.'
    + '\n- Respond ONLY with a JSON object. No markdown, no code fences, no preamble.'
    + '\n- Do NOT put literal newline characters inside the JSON string values.'
    + '\n- Use \\n (two characters: backslash + n) if you need a line break inside the reply.'
    + (lang === 'he'
        ? '\n- You MUST write the "reply" value and ALL "followUps" items in Hebrew only. No English.'
        : '')
    + '\n- Exact shape: {"reply":"<concise answer>","followUps":["<q1>","<q2>","<q3>"]}';

  const trimmed = _trimHistory(history);

  const messages = [
    { role: 'system', content: `${systemPrompt}\n\n${outputRules}` },
    ...trimmed.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: lang === 'he'
        ? `[הוראה קריטית: ענה אך ורק בעברית. כל מילה ב-"reply" וב-"followUps" חייבת להיות בעברית בלבד.]\n${query}`
        : query },
  ];

  let res;
  try {
    res = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: LLM_MODEL, messages, temperature: 0.7, max_tokens: 512 }),
    });
  } catch (netErr) {
    console.error('[mortgageBotHandler] fetch failed:', netErr.message);
    return { reply: _errorReply(lang), followUps: [], error: true };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[mortgageBotHandler] Groq error:', res.status, errText.slice(0, 200));
    return { reply: _errorReply(lang), followUps: [], error: true };
  }

  let raw;
  try {
    const data = await res.json();
    raw = data.choices?.[0]?.message?.content?.trim() ?? '';
  } catch (parseErr) {
    console.error('[mortgageBotHandler] response parse failed:', parseErr.message);
    return { reply: _errorReply(lang), followUps: [], error: true };
  }

  return _parseResponse(raw);
}

function _parseResponse(raw) {
  try {
    const p = JSON.parse(raw);
    if (typeof p.reply === 'string') {
      return { reply: p.reply, followUps: Array.isArray(p.followUps) ? p.followUps.slice(0, 3) : [] };
    }
  } catch { /* fall through */ }

  const replyMatch = raw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (replyMatch) {
    const reply = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    const followUps = [];
    const fupIdx = raw.indexOf('"followUps"');
    if (fupIdx !== -1) {
      for (const m of raw.slice(fupIdx).matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
        if (m[1] === 'followUps') continue;
        followUps.push(m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
        if (followUps.length >= 3) break;
      }
    }
    return { reply, followUps };
  }

  return { reply: raw, followUps: [] };
}

export default { respond };
