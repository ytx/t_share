import express from 'express';
import tagController from '../controllers/tagController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', tagController.getAllTags);
router.get('/popular', tagController.getPopularTags);
router.get('/:id', tagController.getTag);

// Protected routes (authenticated users can create/update/delete tags)
router.post('/', authenticateToken, tagController.createTag);
router.put('/:id', authenticateToken, tagController.updateTag);
router.delete('/:id', authenticateToken, tagController.deleteTag);

export default router;