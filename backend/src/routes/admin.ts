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
import {
  exportAllData,
  importAllData,
  getExportStats,
  validateImportData,
} from '../controllers/dataExportImportController';

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

// Data export (existing)
router.get('/export', exportSystemData);

// Data export/import (new comprehensive functionality)
router.get('/data/export', exportAllData);
router.post('/data/import', importAllData);
router.get('/data/stats', getExportStats);
router.post('/data/validate', validateImportData);

export default router;