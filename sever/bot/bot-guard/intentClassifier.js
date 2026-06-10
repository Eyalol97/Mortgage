import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '../../../shared/env.js';

const CLASSIFIER_MODEL = 'claude-haiku-4-5';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const VALID_CATEGORIES = new Set(['EDUCATION', 'ADVISORY', 'OUT_OF_DOMAIN', 'AMBIGUOUS']);

const CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      enum: ['EDUCATION', 'ADVISORY', 'OUT_OF_DOMAIN', 'AMBIGUOUS'],
    },
  },
  required: ['category'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You classify user messages sent to a mortgage-education chatbot.
Return exactly one category:

EDUCATION     — User wants to understand a mortgage concept, term, regulation, or process (e.g. "What is LTV?", "How does a prime-linked track work?")
ADVISORY      — User is asking for a personal recommendation or decision guidance (e.g. "Should I take a fixed or variable rate?", "Is now a good time to buy?")
OUT_OF_DOMAIN — Question has nothing to do with mortgages or home loans (e.g. "What is the weather?", "Write me a poem")
AMBIGUOUS     — Intent is unclear or the message could belong to multiple categories

Respond only with the JSON object. No explanation.`;

async function classify(query) {
  try {
    const response = await client.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 64,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: CLASSIFICATION_SCHEMA,
        },
      },
    });

    const raw = response.content.find((b) => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(raw);
    const category = typeof parsed.category === 'string'
      ? parsed.category.trim().toUpperCase()
      : '';

    return { category: VALID_CATEGORIES.has(category) ? category : 'AMBIGUOUS' };
  } catch {
    return { category: 'AMBIGUOUS' };
  }
}

export default { classify };
