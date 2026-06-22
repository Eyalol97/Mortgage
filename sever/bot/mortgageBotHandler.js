import Anthropic        from '@anthropic-ai/sdk';
import mortgageBotPrompt  from './mortgageBotPrompt.js';
import regulationService  from '../../shared/regulationService.js';
import { MAIN_LLM_API_KEY, LLM_MODEL } from '../../shared/env.js';

const client = new Anthropic({ apiKey: MAIN_LLM_API_KEY });

// Rough token budget for conversation history (excludes system prompt + RAG).
// At ~4 chars/token, 6 000 tokens ≈ 24 000 chars — comfortable below model limits.
const MAX_HISTORY_TOKENS = 6_000;
const CHARS_PER_TOKEN   = 4;

// JSON schema Claude must follow when generating its reply
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: {
      type: 'string',
      description: 'Conversational answer to the user\'s mortgage question',
    },
    followUps: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 3 natural follow-up questions the user might ask next',
    },
  },
  required: ['reply', 'followUps'],
  additionalProperties: false,
};

// ── history trimmer ────────────────────────────────────────────────────────────
// Walks backwards through the history array, keeping the most recent turns that
// fit within maxTokens. Always starts with a user turn (API requirement).
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

  // Ensure we begin with a user message; drop any leading assistant turns
  while (kept.length > 0 && kept[0].role !== 'user') kept.shift();

  return kept;
}

// ── main exported function ─────────────────────────────────────────────────────
// respond(query, history, { advisory })
//   → { reply: string, followUps: string[] }
async function respond(query, history, { advisory = false } = {}) {
  // Fetch system prompt and RAG chunks in parallel
  const [systemPrompt, ragChunks] = await Promise.all([
    Promise.resolve(mortgageBotPrompt.getPrompt({ advisory })),
    regulationService.retrieve(query),
  ]);

  // Append regulatory context to the system prompt so Claude can cite it
  let fullSystem = systemPrompt;
  if (ragChunks.length > 0) {
    fullSystem +=
      '\n\n## Relevant Regulatory Context\n\n' + ragChunks.join('\n\n---\n\n');
  }

  const messages = [
    ..._trimHistory(history),
    { role: 'user', content: query },
  ];

  const response = await client.messages.create({
    model: LLM_MODEL,
    max_tokens: 1_024,
    system: fullSystem,
    messages,
    output_config: {
      format: {
        type:   'json_schema',
        schema: RESPONSE_SCHEMA,
      },
    },
  });

  const raw = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  const parsed = JSON.parse(raw);   // structured output → always valid JSON

  return {
    reply:     parsed.reply    ?? '',
    followUps: Array.isArray(parsed.followUps)
      ? parsed.followUps.slice(0, 3)
      : [],
  };
}

export default { respond };
