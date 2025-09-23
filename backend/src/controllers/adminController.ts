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

export const getSystemStats = async (_req: Request, res: Response) => {
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
        details: validationResult.error.issues,
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
        details: validationResult.error.issues,
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

export const getSystemHealth = async (_req: Request, res: Response) => {
  try {
    const health = await adminService.getSystemHealthDetails();
    res.json(health);
  } catch (error) {
    logger.error('Get system health failed:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
};

export const exportSystemData = async (_req: Request, res: Response) => {
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

export const getSystemInfo = async (_req: Request, res: Response) => {
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

// User CRUD operations
const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  username: z.string().optional(),
  isAdmin: z.boolean().default(false),
  password: z.string().min(6),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  username: z.string().optional(),
  isAdmin: z.boolean().optional(),
});

export const createUser = async (req: Request, res: Response) => {
  try {
    const validationResult = createUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const user = await adminService.createUser(validationResult.data);
    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error: any) {
    logger.error('Create user failed:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const validationResult = updateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const user = await adminService.updateUser(userId, validationResult.data);
    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error: any) {
    logger.error('Update user failed:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    await adminService.deleteUser(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    logger.error('Delete user failed:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ユーザー承認機能
export const approveUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const adminId = (req as any).user.id;
    const approvedUser = await adminService.approveUser(userId, adminId);

    res.json({
      message: 'User approved successfully',
      user: approvedUser,
    });
  } catch (error: any) {
    logger.error('Approve user failed:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'User is already approved') {
      return res.status(400).json({ error: 'User is already approved' });
    }
    res.status(500).json({ error: 'Failed to approve user' });
  }
};

export const getPendingUsers = async (_req: Request, res: Response) => {
  try {
    const pendingUsers = await adminService.getPendingUsers();
    res.json({
      data: pendingUsers,
    });
  } catch (error: any) {
    logger.error('Get pending users failed:', error);
    res.status(500).json({ error: 'Failed to get pending users' });
  }
};

export const getUserApprovalStats = async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getUserApprovalStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Get user approval stats failed:', error);
    res.status(500).json({ error: 'Failed to get approval stats' });
  }
};

export const approveAllExistingUsers = async (req: Request, res: Response) => {
  try {
    const adminId = (req.user as any).id;
    const result = await adminService.approveAllExistingUsers(adminId);
    res.json({
      message: `Successfully approved ${result.approvedCount} existing users`,
      approvedCount: result.approvedCount,
    });
  } catch (error: any) {
    logger.error('Approve all existing users failed:', error);
    res.status(500).json({ error: 'Failed to approve existing users' });
  }
};