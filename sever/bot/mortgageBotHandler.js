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

async function respond(query, history, { advisory = false } = {}) {
  const systemPrompt = mortgageBotPrompt.getPrompt({ advisory });

  // Build one flat string prompt — same pattern as the working ping call.
  // System instruction is embedded as plain text so no SDK-level systemInstruction
  // or generationConfig features are needed (they were causing 404s on this key).
  let prompt = systemPrompt;
  prompt += '\n\nRespond ONLY with a JSON object — no markdown, no explanation, no code fences.'
           + ' Use this exact shape: {"reply":"<your answer>","followUps":["<q1>","<q2>","<q3>"]}';

  const trimmed = _trimHistory(history);
  if (trimmed.length > 0) {
    prompt += '\n\nConversation so far:';
    for (const msg of trimmed) {
      prompt += `\n${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`;
    }
  }

  prompt += `\n\nUser: ${query}\nAssistant:`;

  const model = genAI.getGenerativeModel({ model: LLM_MODEL });

  try {
    const result = await model.generateContent(prompt);
    const raw    = result.response.text().trim();

    // Extract the first {...} block to tolerate any surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    let parsed = {};
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
    }

    return {
      reply:     typeof parsed.reply === 'string' ? parsed.reply : raw,
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : [],
    };
  } catch (err) {
    console.error('[mortgageBotHandler] Gemini call failed:', {
      model:   LLM_MODEL,
      status:  err.status,
      message: err.message,
    });
    return {
      reply:     "I'm having trouble reaching my knowledge base right now. Please try again in a moment.",
      followUps: [],
    };
  }
}

export default { respond };
