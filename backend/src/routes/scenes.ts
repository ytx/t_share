import express from 'express';
import sceneController from '../controllers/sceneController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', sceneController.getAllScenes);
router.get('/:id', sceneController.getScene);

// Protected routes (admin only for write operations)
router.post('/', authenticateToken, requireAdmin, sceneController.createScene);
router.put('/:id', authenticateToken, requireAdmin, sceneController.updateScene);
router.delete('/:id', authenticateToken, requireAdmin, sceneController.deleteScene);

export default router;