import express from 'express';
import './db.js';                                     // side-effect: opens MongoDB connection
import env            from './env.js';
import errorHandler   from './errorHandler.js';
import profileRoutes  from '../sever/profile/profileRoutes.js';
import simulatorRoutes from '../sever/simulator/simulatorRoutes.js';
import botRoutes      from '../sever/bot/botRoutes.js';

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────

app.use(express.json());

// Inline CORS — no external package needed for this project's access patterns
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Feature routes ────────────────────────────────────────────────────────────

app.use('/api/profile',   profileRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/bot',       botRoutes);

// ── Global error handler ──────────────────────────────────────────────────────

app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
