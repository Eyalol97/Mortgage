import intentClassifier   from './bot-guard/intentClassifier.js';
import ruleFilter         from './bot-guard/ruleFilter.js';
import mortgageBotHandler from './mortgageBotHandler.js';
import GlossaryTerm       from '../../shared/models/GlossaryTerm.js';
import GuardrailLog       from '../../shared/models/GuardrailLog.js';
import UsageCounter       from '../../shared/models/UsageCounter.js';
import errorHandler       from '../../shared/errorHandler.js';

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

async function _handleChip(query, sessionId, res) {
  const term = await GlossaryTerm.findOne({
    term: { $regex: new RegExp(`^${query.trim()}$`, 'i') },
  });

  UsageCounter.increment('chip').catch(() => {});   // fire-and-forget; never blocks response

  const reply    = term?.definition ?? `I don't have a glossary entry for "${query}" yet — try asking me in the chat!`;
  const followUps = term?.followUps ?? [];

  _recordTurn(sessionId, query, reply);
  return res.json({ decision: 'EDUCATION', reply, followUps });
}

// ── free-text path ─────────────────────────────────────────────────────────────

async function _handleFreeText(query, sessionId, res) {
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
      const { reply, followUps = [] } = await mortgageBotHandler.respond(query, history, { advisory: true });
      _recordTurn(sessionId, query, reply);
      return res.json({ decision: 'ADVISORY', reply, followUps });
    }

    case 'ALLOW': {
      const { reply, followUps = [] } = await mortgageBotHandler.respond(query, history, { advisory: false });
      _recordTurn(sessionId, query, reply);
      return res.json({ decision: 'EDUCATION', reply, followUps });
    }

    case 'AMBIGUOUS': {
      const { reply, followUps = [] } = await mortgageBotHandler.respond(query, history, { advisory: false });
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
  const { query, sessionId, isChip = false } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    if (isChip) return await _handleChip(query.trim(), sessionId, res);
    return await _handleFreeText(query.trim(), sessionId, res);
  } catch (err) {
    return errorHandler(err, req, res);
  }
}

async function clearSession(req, res) {
  const { sessionId } = req.body;
  if (sessionId) sessions.delete(sessionId);
  return res.status(204).end();
}

export { chat, clearSession };
