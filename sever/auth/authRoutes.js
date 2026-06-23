import { Router } from 'express';
import { signup, login } from '../../shared/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login',  login);

export default router;
