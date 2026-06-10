import { Router }                                    from 'express';
import auth                                          from '../../shared/auth.js';
import { getProfile, createProfile, updateProfile } from './profileController.js';
import errorHandler                                 from '../../shared/errorHandler.js';

const router = Router();

// All profile routes require a verified user session
router.use(auth);

// GET  /api/profile  — fetch the authenticated user's profile
router.get('/', getProfile);

// POST /api/profile  — create a new profile (one per user)
router.post('/', createProfile);

// PUT  /api/profile  — update the authenticated user's existing profile
router.put('/', updateProfile);

// 404 catch-all for unrecognized sub-paths under /api/profile
router.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found on /api/profile` });
});

// Route-level error boundary — forwards to shared errorHandler
router.use(errorHandler);

export default router;
