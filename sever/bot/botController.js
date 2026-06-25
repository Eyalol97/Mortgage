import { GoogleGenerativeAI } from '@google/generative-ai';
import intentClassifier   from './bot-guard/intentClassifier.js';
import ruleFilter         from './bot-guard/ruleFilter.js';
import mortgageBotHandler from './mortgageBotHandler.js';
import GlossaryTerm       from '../../shared/models/GlossaryTerm.js';
import GuardrailLog       from '../../shared/models/GuardrailLog.js';
import UsageCounter       from '../../shared/models/UsageCounter.js';
import errorHandler       from '../../shared/errorHandler.js';
import { GEMINI_API_KEY, LLM_MODEL } from '../../shared/env.js';

// In-memory session store — keyed by sessionId, wiped on /session/clear.
// Never written to disk; clearing the Map is the only persistence boundary.
const sessions = new Map();

const OUT_OF_DOMAIN_REPLY =
  'I can only answer mortgage-related questions — concepts, interest rate ' +
  'tracks, loan types, and Bank of Israel regulations. Please try a different question.';

// ── session helpers ────────────────────────────────────────────────────────────

function _getHistory(sessionId) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}

function _recordTurn(sessionId, query, reply) {
  const history = _getHistory(sessionId);
  history.push({ role: 'user',      content: query });
  history.push({ role: 'assistant', content: reply });
}

// ── chip path ──────────────────────────────────────────────────────────────────

async function _handleChip(query, sessionId, lang, res) {
  UsageCounter.increment('chip').catch(() => {});

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const term = await GlossaryTerm.findOne({
    term: { $regex: new RegExp(`^${escaped}$`, 'i') },
  });

  const reply = lang === 'he'
    ? (term?.definitionHe || term?.definition || `אין לי ערך מילון עבור "${query}" עדיין — נסה לשאול אותי בצ'אט!`)
    : (term?.definition ?? `I don't have a glossary entry for "${query}" yet — try asking me in the chat!`);

  const followUps = lang === 'he'
    ? (term?.followUpsHe?.length ? term.followUpsHe : term?.followUps ?? [])
    : (term?.followUps ?? []);

  _recordTurn(sessionId, query, reply);
  return res.json({ decision: 'EDUCATION', reply, followUps });
}

// ── free-text path ─────────────────────────────────────────────────────────────

async function _handleFreeText(query, sessionId, lang, res) {
  const history = _getHistory(sessionId);

  // Layer 1 — lightweight intent classifier
  const classifierResult = await intentClassifier.classify(query);

  // Layer 2 — rule-based filter → final routing decision
  const { decision: routingDecision } = await ruleFilter.filter(classifierResult, query);

  // Log every guardrail decision; failure must not break the response
  GuardrailLog.create({ query, classifierResult, routingDecision }).catch(() => {});

  switch (routingDecision) {

    case 'DOMAIN_BLOCK': {
      return res.json({ decision: 'OUT_OF_DOMAIN', reply: OUT_OF_DOMAIN_REPLY, followUps: [] });
    }

    case 'ADVISORY_BLOCK': {
      const { reply, followUps = [] } = await mortgageBotHandler.respond(query, history, { advisory: true, lang });
      _recordTurn(sessionId, query, reply);
      return res.json({ decision: 'ADVISORY', reply, followUps });
    }

    case 'ALLOW': {
      const { reply, followUps = [] } = await mortgageBotHandler.respond(query, history, { advisory: false, lang });
      _recordTurn(sessionId, query, reply);
      return res.json({ decision: 'EDUCATION', reply, followUps });
    }

    case 'AMBIGUOUS': {
      const { reply, followUps = [] } = await mortgageBotHandler.respond(query, history, { advisory: false, lang });
      _recordTurn(sessionId, query, reply);
      return res.json({ decision: 'AMBIGUOUS', reply, followUps });
    }

    default: {
      return res.json({ decision: 'OUT_OF_DOMAIN', reply: OUT_OF_DOMAIN_REPLY, followUps: [] });
    }
  }
}

// ── exported route handlers ────────────────────────────────────────────────────

async function chat(req, res) {
  const { query, sessionId, isChip = false, lang = 'en' } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    if (isChip) return await _handleChip(query.trim(), sessionId, lang, res);
    return await _handleFreeText(query.trim(), sessionId, lang, res);
  } catch (err) {
    return errorHandler(err, req, res);
  }
}

async function getChips(req, res) {
  try {
    const terms = await GlossaryTerm.find({}, 'term followUps').lean();
    return res.json({ chips: terms.map((t) => ({ label: t.term, followUps: t.followUps ?? [] })) });
  } catch (err) {
    return errorHandler(err, req, res);
  }
}

async function clearSession(req, res) {
  const { sessionId } = req.body;
  if (sessionId) sessions.delete(sessionId);
  return res.status(204).end();
}

// ── diagnostic: lists available models + tests a simple generate call ─────────
async function pingGemini(req, res) {
  const keySnippet = GEMINI_API_KEY ? GEMINI_API_KEY.slice(0, 8) + '...' : 'NOT SET';

  // Step 1 — call ListModels to find what this key can actually use
  let geminiModels = [];
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}&pageSize=50`
    );
    const listData = await listRes.json();
    geminiModels = (listData.models ?? [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));
  } catch (listErr) {
    geminiModels = [`[list error] ${listErr.message}`];
  }

  // Step 2 — two tests: (a) simple string, (b) matches the actual chat handler prompt
  const genAI2 = new GoogleGenerativeAI(GEMINI_API_KEY);

  async function tryModel(modelName, prompt) {
    try {
      const m = genAI2.getGenerativeModel({ model: modelName });
      const r = await m.generateContent(prompt);
      return { success: true, response: r.response.text().slice(0, 120) };
    } catch (e) {
      return { success: false, status: e.status, message: (e.message || '').slice(0, 120) };
    }
  }

  const chatPrompt = 'You are a mortgage assistant. Respond ONLY with JSON: {"reply":"<answer>","followUps":[]}\n\nUser: What is LTV?\nAssistant:';

  const [simpleTest, chatTest] = await Promise.all([
    tryModel(LLM_MODEL, 'Reply with the single word: OK'),
    tryModel(LLM_MODEL, chatPrompt),
  ]);

  return res.json({
    configuredModel: LLM_MODEL,
    keyPrefix:       keySnippet,
    simpleTest,
    chatPromptTest:  chatTest,
    availableModels: geminiModels,
  });
}

export { chat, getChips, clearSession, pingGemini };
