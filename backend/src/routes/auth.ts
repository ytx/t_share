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
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, _info) => {
      if (err) {
        // Authentication error occurred
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
        return res.redirect(`${frontendUrl}/auth/error?reason=org_internal`);
      }

      if (!user) {
        // Authentication failed (e.g., user denied access, org restriction)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
        return res.redirect(`${frontendUrl}/auth/error?reason=org_internal`);
      }

      // Success - attach user to request and continue
      req.user = user;
      next();
    })(req, res, next);
  },
  authController.googleCallback
);

// Error handling endpoint
router.get('/error', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
  const reason = req.query.reason || 'auth_failed';
  res.redirect(`${frontendUrl}/auth/error?reason=${reason}`);
});

// Protected routes
router.get('/me', authenticateToken, authController.me);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/refresh', authenticateToken, authController.refreshToken);

export default router;