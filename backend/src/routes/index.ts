import express from 'express';
import authRoutes from './auth';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);

// API information
router.get('/', (req, res) => {
  res.json({
    message: 'Template Share API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      templates: '/api/templates (coming in Phase 2)',
      projects: '/api/projects (coming in Phase 2)',
      documents: '/api/documents (coming in Phase 3)',
    },
  });
});

export default router;