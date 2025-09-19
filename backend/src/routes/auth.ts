import express from 'express';
import passport from 'passport';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Local authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

// Protected routes
router.get('/me', authenticateToken, authController.me);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/refresh', authenticateToken, authController.refreshToken);

export default router;