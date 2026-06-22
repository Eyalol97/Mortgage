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
  const [systemPrompt, ragChunks] = await Promise.all([
    Promise.resolve(mortgageBotPrompt.getPrompt({ advisory })),
    regulationService.retrieve(query),
  ]);

  let fullSystem = systemPrompt;
  if (ragChunks.length > 0) {
    fullSystem += '\n\n## Relevant Regulatory Context\n\n' + ragChunks.join('\n\n---\n\n');
  }
  fullSystem += '\n\nAlways respond with valid JSON: {"reply": "<string>", "followUps": ["<string>", ...]}';

  const model = genAI.getGenerativeModel({
    model: LLM_MODEL,
    systemInstruction: fullSystem,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const geminiHistory = _trimHistory(history).map(msg => ({
    role:  msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat   = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(query);
  const parsed = JSON.parse(result.response.text());

  return {
    reply:     parsed.reply     ?? '',
    followUps: Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : [],
  };
}

export default { respond };
