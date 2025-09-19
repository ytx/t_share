import express from 'express';
import templateController from '../controllers/templateController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public routes (optional authentication for personalization)
router.get('/', optionalAuth, templateController.searchTemplates);
router.get('/:id', optionalAuth, templateController.getTemplate);

// Protected routes (authentication required)
router.post('/', authenticateToken, templateController.createTemplate);
router.put('/:id', authenticateToken, templateController.updateTemplate);
router.delete('/:id', authenticateToken, templateController.deleteTemplate);
router.post('/:id/use', authenticateToken, templateController.useTemplate);

// Version management routes
router.get('/:id/versions', authenticateToken, templateController.getTemplateVersions);
router.post('/:id/restore/:version', authenticateToken, templateController.restoreTemplateVersion);

export default router;