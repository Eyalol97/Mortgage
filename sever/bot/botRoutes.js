import { Router }                   from 'express';
import { chat, getChips, clearSession, pingGemini } from './botController.js';
import errorHandler                from '../../shared/errorHandler.js';

const router = Router();

// ── lightweight field-presence guard ──────────────────────────────────────────
// Deeper type/content validation lives in the controller; this layer only
// rejects requests that are structurally malformed (missing required keys).
function requireFields(...fields) {
  return (req, res, next) => {
    for (const field of fields) {
      const val = req.body?.[field];
      if (val === undefined || val === null || val === '') {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    next();
  };
}

// ── routes ────────────────────────────────────────────────────────────────────

// GET  /api/bot/ping-gemini — diagnostic: verify Gemini API key + model access
router.get('/ping-gemini', pingGemini);

// POST /api/bot/chat  — free-text query or chip selection
router.post('/chat', requireFields('query', 'sessionId'), chat);

// GET  /api/bot/chips — fetch the dynamic chip list from the glossary
router.get('/chips', getChips);

// POST /api/bot/session/clear — wipe server-side session on page unload
router.post('/session/clear', requireFields('sessionId'), clearSession);

// 404 catch-all for any unrecognized sub-path under this router's mount point
router.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found on /api/bot` });
});

// Route-level error boundary — forwards to shared errorHandler
router.use(errorHandler);

export default router;
