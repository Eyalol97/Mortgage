import { GROQ_API_KEY } from '../../../shared/env.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VALID_CATEGORIES = new Set(['EDUCATION', 'ADVISORY', 'OUT_OF_DOMAIN', 'AMBIGUOUS']);

const SYSTEM_PROMPT = `You classify user messages sent to a mortgage-education chatbot.
Return exactly one category:

EDUCATION     — User wants to understand a mortgage concept, term, regulation, or process (e.g. "What is LTV?", "How does a prime-linked track work?")
ADVISORY      — User is asking for a personal recommendation or decision guidance (e.g. "Should I take a fixed or variable rate?", "Is now a good time to buy?")
OUT_OF_DOMAIN — Question has nothing to do with mortgages or home loans (e.g. "What is the weather?", "Write me a poem")
AMBIGUOUS     — Intent is unclear or the message could belong to multiple categories

Respond only with JSON: {"category": "EDUCATION"|"ADVISORY"|"OUT_OF_DOMAIN"|"AMBIGUOUS"}`;

async function classify(query) {
  try {
    const res = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       'llama-3.1-8b-instant',
        messages:    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
        temperature: 0,
        max_tokens:  64,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return { category: 'AMBIGUOUS' };

    const data    = await res.json();
    const text    = data.choices?.[0]?.message?.content ?? '';
    const parsed  = JSON.parse(text);
    const category = typeof parsed.category === 'string' ? parsed.category.trim().toUpperCase() : '';

    return { category: VALID_CATEGORIES.has(category) ? category : 'AMBIGUOUS' };
  } catch {
    return { category: 'AMBIGUOUS' };
  }
}

export default { classify };
