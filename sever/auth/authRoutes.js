import { Router } from 'express';
import { signup, login, googleAuth, authMiddleware, isAdminEmail } from '../../shared/auth.js';
import User from '../../shared/models/User.js';

const router = Router();

router.post('/signup', signup);
router.post('/login',  login);
router.post('/google', googleAuth);

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('email');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const isAdmin = isAdminEmail(user.email);
    res.json({ email: user.email, isAdmin });
  } catch (err) { next(err); }
});

export default router;
