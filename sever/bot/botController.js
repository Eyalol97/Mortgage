import intentClassifier   from './bot-guard/intentClassifier.js';
import ruleFilter         from './bot-guard/ruleFilter.js';
import mortgageBotHandler from './mortgageBotHandler.js';
import GlossaryTerm       from '../../shared/models/GlossaryTerm.js';
import GuardrailLog       from '../../shared/models/GuardrailLog.js';
import UsageCounter       from '../../shared/models/UsageCounter.js';
import errorHandler       from '../../shared/errorHandler.js';
import { GROQ_API_KEY, LLM_MODEL } from '../../shared/env.js';

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

  if (!term) return _handleFreeText(query, sessionId, lang, res);

  const reply = lang === 'he'
    ? (term.definitionHe || term.definition || `אין לי ערך מילון עבור "${query}" עדיין — נסה לשאול אותי בצ'אט!`)
    : (term.definition ?? `I don't have a glossary entry for "${query}" yet — try asking me in the chat!`);

  const followUps = lang === 'he'
    ? (term.followUpsHe?.length ? term.followUpsHe : term.followUps ?? [])
    : (term.followUps ?? []);

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

// ── diagnostic: tests Groq API key + model ────────────────────────────────────
async function pingGemini(req, res) {
  const keySnippet = GROQ_API_KEY ? GROQ_API_KEY.slice(0, 8) + '...' : 'NOT SET';

  async function tryGroq(prompt) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 64,
        }),
      });
      const data = await r.json();
      if (!r.ok) return { success: false, status: r.status, message: JSON.stringify(data).slice(0, 200) };
      return { success: true, response: data.choices?.[0]?.message?.content?.slice(0, 120) };
    } catch (e) {
      return { success: false, message: e.message.slice(0, 120) };
    }
  }

  const [simpleTest, chatTest] = await Promise.all([
    tryGroq('Reply with the single word: OK'),
    tryGroq('You are a mortgage assistant. Respond ONLY with JSON: {"reply":"<answer>","followUps":[]}\n\nUser: What is LTV?\nAssistant:'),
  ]);

  return res.json({ configuredModel: LLM_MODEL, keyPrefix: keySnippet, simpleTest, chatPromptTest: chatTest });
}

export { chat, getChips, clearSession, pingGemini };
