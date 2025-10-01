import express from 'express';
import authRoutes from './auth';
import templateRoutes from './templates';
import sceneRoutes from './scenes';
import tagRoutes from './tags';
import projectRoutes from './projects';
import documentRoutes from './documents';
import userVariableRoutes from './userVariables';
import projectVariableRoutes from './projectVariables';
import userPreferenceRoutes from './userPreferences';
import adminRoutes from './admin';
import claudeHistoryRoutes from './claudeHistory';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/scenes', sceneRoutes);
router.use('/tags', tagRoutes);
router.use('/projects', projectRoutes);
router.use('/documents', documentRoutes);
router.use('/user-variables', userVariableRoutes);
router.use('/project-variables', projectVariableRoutes);
router.use('/user-preferences', userPreferenceRoutes);
router.use('/admin', adminRoutes);
router.use('/claude-history', claudeHistoryRoutes);

// API information
router.get('/', (_req, res) => {
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
      userVariables: '/api/user-variables',
      projectVariables: '/api/project-variables',
      userPreferences: '/api/user-preferences',
      admin: '/api/admin',
      claudeHistory: '/api/claude-history',
    },
  });
});

export default router;