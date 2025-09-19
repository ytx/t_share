import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
  updateEditorSettings,
  updateUISettings,
  updateNotificationSettings,
  exportUserPreferences,
  importUserPreferences,
} from '../controllers/userPreferenceController';

const router = express.Router();

router.use(authenticateToken);

// Main preferences endpoints
router.get('/', getUserPreferences);
router.put('/', updateUserPreferences);
router.post('/reset', resetUserPreferences);

// Specific settings endpoints
router.put('/editor', updateEditorSettings);
router.put('/ui', updateUISettings);
router.put('/notifications', updateNotificationSettings);

// Import/Export endpoints
router.get('/export', exportUserPreferences);
router.post('/import', importUserPreferences);

export default router;