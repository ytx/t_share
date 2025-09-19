import express from 'express';
import authRoutes from './auth';
import templateRoutes from './templates';
import sceneRoutes from './scenes';
import tagRoutes from './tags';
import projectRoutes from './projects';
import documentRoutes from './documents';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/scenes', sceneRoutes);
router.use('/tags', tagRoutes);
router.use('/projects', projectRoutes);
router.use('/documents', documentRoutes);

// API information
router.get('/', (req, res) => {
  res.json({
    message: 'Template Share API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      templates: '/api/templates',
      scenes: '/api/scenes',
      tags: '/api/tags',
      projects: '/api/projects',
      documents: '/api/documents',
    },
  });
});

export default router;