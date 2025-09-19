import { Request, Response } from 'express';
import { z } from 'zod';
import adminService from '../services/adminService';
import logger from '../utils/logger';

const getUserListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const getRecentActivitySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
});

// Middleware to check admin permissions
export const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = req.user;
  if (!user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (error) {
    logger.error('Get system stats failed:', error);
    res.status(500).json({ error: 'Failed to get system statistics' });
  }
};

export const getUserList = async (req: Request, res: Response) => {
  try {
    const validationResult = getUserListSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { page, limit } = validationResult.data;
    const result = await adminService.getUserList(page, limit);
    res.json(result);
  } catch (error) {
    logger.error('Get user list failed:', error);
    res.status(500).json({ error: 'Failed to get user list' });
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const validationResult = getRecentActivitySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { limit } = validationResult.data;
    const activities = await adminService.getRecentActivity(limit);
    res.json({ data: activities });
  } catch (error) {
    logger.error('Get recent activity failed:', error);
    res.status(500).json({ error: 'Failed to get recent activity' });
  }
};

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const health = await adminService.getSystemHealthDetails();
    res.json(health);
  } catch (error) {
    logger.error('Get system health failed:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
};

export const exportSystemData = async (req: Request, res: Response) => {
  try {
    // This would be a more complex operation in a real system
    const stats = await adminService.getSystemStats();
    const userList = await adminService.getUserList(1, 1000);
    const recentActivity = await adminService.getRecentActivity(100);

    const exportData = {
      exportedAt: new Date().toISOString(),
      stats,
      users: userList.data.map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        _count: user._count,
      })),
      recentActivity,
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="system-data.json"');

    res.json(exportData);
  } catch (error) {
    logger.error('Export system data failed:', error);
    res.status(500).json({ error: 'Failed to export system data' });
  }
};

export const getSystemInfo = async (req: Request, res: Response) => {
  try {
    const info = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };

    res.json(info);
  } catch (error) {
    logger.error('Get system info failed:', error);
    res.status(500).json({ error: 'Failed to get system information' });
  }
};