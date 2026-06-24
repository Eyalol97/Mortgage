import { Router } from 'express';
import { signup, login, googleAuth } from '../../shared/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login',  login);
router.post('/google', googleAuth);

export default router;
