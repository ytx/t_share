import express from 'express';
import authRoutes from './auth';
import templateRoutes from './templates';
import sceneRoutes from './scenes';
import tagRoutes from './tags';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/scenes', sceneRoutes);
router.use('/tags', tagRoutes);

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
      projects: '/api/projects (coming in Phase 2)',
      documents: '/api/documents (coming in Phase 3)',
    },
  });
});

export default router;