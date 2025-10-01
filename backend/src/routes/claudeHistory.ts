import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as claudeHistoryController from '../controllers/claudeHistoryController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Import JSONL file
router.post(
  '/import',
  claudeHistoryController.uploadMiddleware,
  claudeHistoryController.importJsonl
);

// Get import statistics
router.get('/stats', claudeHistoryController.getImportStats);

// Get import history
router.get('/history', claudeHistoryController.getImportHistory);

export default router;
