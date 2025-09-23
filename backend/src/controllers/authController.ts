import { Request, Response } from 'express';
import authService from '../services/authService';
import { userValidation } from '../utils/validation';
import logger from '../utils/logger';
import { handleControllerError } from '../utils/errorHandler';

class AuthController {
  async register(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = userValidation.register.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const result = await authService.register(value);

      return res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Register controller', 'Registration failed');
    }
  }

  async login(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = userValidation.login.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const result = await authService.login(value);

      return res.status(200).json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Login controller', 'Login failed');
    }
  }

  async googleCallback(req: Request, res: Response) {
    try {
      const user = req.user as any; // Passport user object

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Google authentication failed',
        });
      }

      const result = await authService.googleAuth({
        googleId: user.id,
        email: user.emails[0].value,
        displayName: user.displayName,
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';

      // Check approval status and redirect accordingly
      if (result.user.approvalStatus === 'pending') {
        // Redirect to pending approval page
        return res.redirect(`${frontendUrl}/auth/pending-approval`);
      } else if (result.user.approvalStatus === 'approved') {
        // Redirect with token for approved users
        return res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
      } else {
        // Handle other statuses (shouldn't normally happen)
        return res.redirect(`${frontendUrl}/auth/error?reason=unknown_status`);
      }
    } catch (error: unknown) {
      logger.error('Google callback controller error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
      return res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const user = await authService.getUserById(req.user!.id);

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      return res.status(200).json({
        user,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Me controller', 'Failed to get user information');
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Validate request body
      const { error, value } = userValidation.update.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const user = await authService.updateUser(req.user!.id, value);

      return res.status(200).json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Update profile controller', 'Failed to update profile');
    }
  }

  async logout(_req: Request, res: Response) {
    try {
      // For JWT tokens, logout is handled on the client side
      // Server can optionally maintain a blacklist of revoked tokens
      return res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Logout controller', 'Logout failed');
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Generate new token
      const jwtSecret = process.env.JWT_SECRET;
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const jwt = require('jsonwebtoken');
      const newToken = jwt.sign({ userId: req.user!.id }, jwtSecret, { expiresIn: jwtExpiresIn });

      return res.status(200).json({
        message: 'Token refreshed successfully',
        token: newToken,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Refresh token controller', 'Token refresh failed');
    }
  }
}

export default new AuthController();