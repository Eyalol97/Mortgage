import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../../../shared/env.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-8b',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 64 },
    });

    const result   = await model.generateContent(query);
    const parsed   = JSON.parse(result.response.text());
    const category = typeof parsed.category === 'string'
      ? parsed.category.trim().toUpperCase()
      : '';

    return { category: VALID_CATEGORIES.has(category) ? category : 'AMBIGUOUS' };
  } catch {
    return { category: 'AMBIGUOUS' };
  }
}

export default { classify };
