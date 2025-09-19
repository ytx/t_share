import { Request, Response } from 'express';
import { z } from 'zod';
import userPreferenceService from '../services/userPreferenceService';
import logger from '../utils/logger';

const editorSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  showLineNumbers: z.boolean().optional(),
  wordWrap: z.boolean().optional(),
  fontSize: z.number().min(8).max(24).optional(),
  keybinding: z.enum(['default', 'vim', 'emacs']).optional(),
  showWhitespace: z.boolean().optional(),
}).optional();

const uiSettingsSchema = z.object({
  sidebarOpen: z.boolean().optional(),
  compactMode: z.boolean().optional(),
  showMinimap: z.boolean().optional(),
}).optional();

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  browserNotifications: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
}).optional();

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.enum(['ja', 'en']).optional(),
  editorSettings: editorSettingsSchema,
  uiSettings: uiSettingsSchema,
  notifications: notificationSettingsSchema,
});

const updateEditorSettingsSchema = editorSettingsSchema;
const updateUISettingsSchema = uiSettingsSchema;
const updateNotificationSettingsSchema = notificationSettingsSchema;

export const getUserPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const preferences = await userPreferenceService.getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    logger.error('Get user preferences failed:', error);
    res.status(500).json({ error: 'Failed to get user preferences' });
  }
};

export const updateUserPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = updatePreferencesSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const preferences = await userPreferenceService.updateUserPreferences(userId, validationResult.data);
    res.json(preferences);
  } catch (error) {
    logger.error('Update user preferences failed:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
};

export const resetUserPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const preferences = await userPreferenceService.resetUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    logger.error('Reset user preferences failed:', error);
    res.status(500).json({ error: 'Failed to reset user preferences' });
  }
};

export const updateEditorSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = updateEditorSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const preferences = await userPreferenceService.updateEditorSettings(userId, validationResult.data);
    res.json(preferences);
  } catch (error) {
    logger.error('Update editor settings failed:', error);
    res.status(500).json({ error: 'Failed to update editor settings' });
  }
};

export const updateUISettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = updateUISettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const preferences = await userPreferenceService.updateUISettings(userId, validationResult.data);
    res.json(preferences);
  } catch (error) {
    logger.error('Update UI settings failed:', error);
    res.status(500).json({ error: 'Failed to update UI settings' });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = updateNotificationSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const preferences = await userPreferenceService.updateNotificationSettings(userId, validationResult.data);
    res.json(preferences);
  } catch (error) {
    logger.error('Update notification settings failed:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
};

export const exportUserPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const exportData = await userPreferenceService.exportUserPreferences(userId);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="user-preferences.json"');

    res.json(exportData);
  } catch (error) {
    logger.error('Export user preferences failed:', error);
    res.status(500).json({ error: 'Failed to export user preferences' });
  }
};

export const importUserPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    const preferences = await userPreferenceService.importUserPreferences(userId, req.body);
    res.json(preferences);
  } catch (error) {
    logger.error('Import user preferences failed:', error);
    res.status(500).json({ error: 'Failed to import user preferences' });
  }
};