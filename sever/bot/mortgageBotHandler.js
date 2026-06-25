import { GoogleGenerativeAI } from '@google/generative-ai';
import mortgageBotPrompt     from './mortgageBotPrompt.js';
import regulationService     from '../../shared/regulationService.js';
import { GEMINI_API_KEY, LLM_MODEL } from '../../shared/env.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

  let prompt = systemPrompt;
  prompt += '\n\nOUTPUT RULES (follow exactly):'
          + '\n- Reply in 2-3 short sentences — be concise and direct.'
          + '\n- Respond ONLY with a JSON object. No markdown, no code fences, no preamble.'
          + '\n- Do NOT put literal newline characters inside the JSON string values.'
          + '\n- Use \\n (two characters: backslash + n) if you need a line break inside the reply.'
          + (lang === 'he'
              ? '\n- You MUST write the "reply" value and ALL "followUps" items in Hebrew only. No English.'
              : '')
          + '\n- Exact shape: {"reply":"<concise answer>","followUps":["<q1>","<q2>","<q3>"]}';

  const trimmed = _trimHistory(history);
  if (trimmed.length > 0) {
    prompt += '\n\nConversation so far:';
    for (const msg of trimmed) {
      prompt += `\n${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`;
    }
  }

  if (lang === 'he') {
    prompt += `\n\n[הוראה קריטית: ענה אך ורק בעברית. כל מילה ב-"reply" וב-"followUps" חייבת להיות בעברית בלבד.]\nUser: ${query}\nAssistant:`;
  } else {
    prompt += `\n\nUser: ${query}\nAssistant:`;
  }

  const model = genAI.getGenerativeModel({ model: LLM_MODEL });

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (apiErr) {
    console.error('[mortgageBotHandler] generateContent failed:', {
      model: LLM_MODEL, status: apiErr.status, message: apiErr.message,
    });
    return { reply: _errorReply(lang), followUps: [], error: true };
  }

  let raw;
  try {
    raw = result.response.text().trim();
  } catch (textErr) {
    const candidate = result.response.candidates?.[0];
    console.error('[mortgageBotHandler] response.text() threw:', {
      finishReason: candidate?.finishReason, message: textErr.message,
    });
    return { reply: _errorReply(lang), followUps: [], error: true };
  }

  return _parseResponse(raw);
}

function _parseResponse(raw) {
  // Attempt 1 — standard JSON.parse (works when model obeys the format)
  try {
    const p = JSON.parse(raw);
    if (typeof p.reply === 'string') {
      return {
        reply:     p.reply,
        followUps: Array.isArray(p.followUps) ? p.followUps.slice(0, 3) : [],
      };
    }
  } catch { /* fall through */ }

  // Attempt 2 — regex extraction.
  // Handles the common failure where the model puts literal newlines inside
  // the JSON string value, making JSON.parse reject the whole response.
  // [^"\\] matches any char except quote/backslash (including literal \n).
  // \\. matches any JSON escape sequence (\n, \", \\, etc.).
  const replyMatch = raw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (replyMatch) {
    const reply = replyMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

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

  // Attempt 3 — give up parsing, return raw text as-is
  return { reply: raw, followUps: [] };
}

export default { respond };
