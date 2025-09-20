import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is required',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    // Get user from database to ensure user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isAdmin: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Check if user is approved (unless they are admin)
    if (user.approvalStatus !== 'approved' && !user.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account pending approval',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or expired token',
    });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (!(req.user as any).isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required',
    });
  }

  next();
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without authentication
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isAdmin: true,
        approvalStatus: true,
      },
    });

    // Only set user if they exist and are approved (or admin)
    if (user && (user.approvalStatus === 'approved' || user.isAdmin)) {
      req.user = user;
    }
  } catch (error) {
    // Invalid token, but continue without authentication
    logger.warn('Optional auth failed:', error);
  }

  next();
};

// AuthenticatedRequest is now the standard Express Request with extended user property