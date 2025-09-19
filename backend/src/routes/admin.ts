import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  requireAdmin,
  getSystemStats,
  getUserList,
  getRecentActivity,
  getSystemHealth,
  exportSystemData,
  getSystemInfo,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/adminController';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// System statistics and monitoring
router.get('/stats', getSystemStats);
router.get('/health', getSystemHealth);
router.get('/info', getSystemInfo);

// User management
router.get('/users', getUserList);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Activity monitoring
router.get('/activity', getRecentActivity);

// Data export
router.get('/export', exportSystemData);

export default router;