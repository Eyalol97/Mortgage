import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../../shared/auth.js';
import {
  getStats, getUsers, deleteUser,
  getProfiles, deleteProfile, getLogs,
} from './adminController.js';

const router = Router();

// All admin routes require a valid JWT + admin email check
router.use(authMiddleware, adminMiddleware);

router.get('/stats',           getStats);
router.get('/users',           getUsers);
router.delete('/users/:id',    deleteUser);
router.get('/profiles',        getProfiles);
router.delete('/profiles/:id', deleteProfile);
router.get('/logs',            getLogs);

export default router;
