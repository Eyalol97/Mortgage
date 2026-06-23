import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import './db.js';                                     // side-effect: opens MongoDB connection
import env            from './env.js';
import errorHandler   from './errorHandler.js';
import profileRoutes  from '../sever/profile/profileRoutes.js';
import simulatorRoutes from '../sever/simulator/simulatorRoutes.js';
import botRoutes      from '../sever/bot/botRoutes.js';
import authRoutes     from '../sever/auth/authRoutes.js';

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

// ── Static frontend ──────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../client')));
app.use('/shared', express.static(__dirname));

// ── Feature routes ────────────────────────────────────────────────────────────

app.use('/api/auth',      authRoutes);
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
