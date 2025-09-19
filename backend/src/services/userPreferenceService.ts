import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface UserPreferenceData {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'ja' | 'en';
  editorSettings?: {
    theme?: 'light' | 'dark';
    showLineNumbers?: boolean;
    wordWrap?: boolean;
    fontSize?: number;
    keybinding?: 'default' | 'vim' | 'emacs';
    showWhitespace?: boolean;
  };
  uiSettings?: {
    sidebarOpen?: boolean;
    compactMode?: boolean;
    showMinimap?: boolean;
  };
  notifications?: {
    emailNotifications?: boolean;
    browserNotifications?: boolean;
    soundEnabled?: boolean;
  };
}

class UserPreferenceService {
  async getUserPreferences(userId: number) {
    try {
      const preferences = await prisma.userPreference.findFirst({
        where: { userId },
      });

      if (!preferences) {
        // Return default preferences if none exist
        return this.getDefaultPreferences();
      }

      // Parse JSON fields
      const parsedPreferences = {
        id: preferences.id,
        userId: preferences.userId,
        theme: preferences.theme as 'light' | 'dark' | 'auto',
        language: preferences.language as 'ja' | 'en',
        editorSettings: preferences.editorSettings ? JSON.parse(preferences.editorSettings) : this.getDefaultPreferences().editorSettings,
        uiSettings: preferences.uiSettings ? JSON.parse(preferences.uiSettings) : this.getDefaultPreferences().uiSettings,
        notifications: preferences.notifications ? JSON.parse(preferences.notifications) : this.getDefaultPreferences().notifications,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      };

      return parsedPreferences;
    } catch (error) {
      logger.error('Get user preferences failed:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId: number, data: UserPreferenceData) {
    try {
      // Get existing preferences or create with defaults
      const existingPreferences = await prisma.userPreference.findFirst({
        where: { userId },
      });

      const updateData = {
        theme: data.theme,
        language: data.language,
        editorSettings: data.editorSettings ? JSON.stringify(data.editorSettings) : undefined,
        uiSettings: data.uiSettings ? JSON.stringify(data.uiSettings) : undefined,
        notifications: data.notifications ? JSON.stringify(data.notifications) : undefined,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      let preferences;

      if (existingPreferences) {
        // Update existing preferences
        preferences = await prisma.userPreference.update({
          where: { id: existingPreferences.id },
          data: updateData,
        });
      } else {
        // Create new preferences
        preferences = await prisma.userPreference.create({
          data: {
            userId,
            ...updateData,
          },
        });
      }

      logger.info(`User preferences updated for user ${userId}`);

      // Return parsed preferences
      return this.getUserPreferences(userId);
    } catch (error) {
      logger.error('Update user preferences failed:', error);
      throw error;
    }
  }

  async resetUserPreferences(userId: number) {
    try {
      const existingPreferences = await prisma.userPreference.findFirst({
        where: { userId },
      });

      if (existingPreferences) {
        await prisma.userPreference.delete({
          where: { id: existingPreferences.id },
        });
      }

      logger.info(`User preferences reset for user ${userId}`);
      return this.getDefaultPreferences();
    } catch (error) {
      logger.error('Reset user preferences failed:', error);
      throw error;
    }
  }

  async updateEditorSettings(userId: number, editorSettings: UserPreferenceData['editorSettings']) {
    try {
      const currentPreferences = await this.getUserPreferences(userId);

      const updatedEditorSettings = {
        ...currentPreferences.editorSettings,
        ...editorSettings,
      };

      return this.updateUserPreferences(userId, {
        editorSettings: updatedEditorSettings,
      });
    } catch (error) {
      logger.error('Update editor settings failed:', error);
      throw error;
    }
  }

  async updateUISettings(userId: number, uiSettings: UserPreferenceData['uiSettings']) {
    try {
      const currentPreferences = await this.getUserPreferences(userId);

      const updatedUISettings = {
        ...currentPreferences.uiSettings,
        ...uiSettings,
      };

      return this.updateUserPreferences(userId, {
        uiSettings: updatedUISettings,
      });
    } catch (error) {
      logger.error('Update UI settings failed:', error);
      throw error;
    }
  }

  async updateNotificationSettings(userId: number, notifications: UserPreferenceData['notifications']) {
    try {
      const currentPreferences = await this.getUserPreferences(userId);

      const updatedNotifications = {
        ...currentPreferences.notifications,
        ...notifications,
      };

      return this.updateUserPreferences(userId, {
        notifications: updatedNotifications,
      });
    } catch (error) {
      logger.error('Update notification settings failed:', error);
      throw error;
    }
  }

  private getDefaultPreferences(): Omit<any, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
    return {
      theme: 'auto' as const,
      language: 'ja' as const,
      editorSettings: {
        theme: 'light' as const,
        showLineNumbers: true,
        wordWrap: true,
        fontSize: 14,
        keybinding: 'default' as const,
        showWhitespace: false,
      },
      uiSettings: {
        sidebarOpen: true,
        compactMode: false,
        showMinimap: true,
      },
      notifications: {
        emailNotifications: true,
        browserNotifications: true,
        soundEnabled: false,
      },
    };
  }

  async exportUserPreferences(userId: number) {
    try {
      const preferences = await this.getUserPreferences(userId);

      // Remove system fields for export
      const exportData = {
        theme: preferences.theme,
        language: preferences.language,
        editorSettings: preferences.editorSettings,
        uiSettings: preferences.uiSettings,
        notifications: preferences.notifications,
        exportedAt: new Date().toISOString(),
      };

      return exportData;
    } catch (error) {
      logger.error('Export user preferences failed:', error);
      throw error;
    }
  }

  async importUserPreferences(userId: number, importData: any) {
    try {
      // Validate import data structure
      const validatedData: UserPreferenceData = {};

      if (importData.theme && ['light', 'dark', 'auto'].includes(importData.theme)) {
        validatedData.theme = importData.theme;
      }

      if (importData.language && ['ja', 'en'].includes(importData.language)) {
        validatedData.language = importData.language;
      }

      if (importData.editorSettings && typeof importData.editorSettings === 'object') {
        validatedData.editorSettings = importData.editorSettings;
      }

      if (importData.uiSettings && typeof importData.uiSettings === 'object') {
        validatedData.uiSettings = importData.uiSettings;
      }

      if (importData.notifications && typeof importData.notifications === 'object') {
        validatedData.notifications = importData.notifications;
      }

      const preferences = await this.updateUserPreferences(userId, validatedData);

      logger.info(`User preferences imported for user ${userId}`);
      return preferences;
    } catch (error) {
      logger.error('Import user preferences failed:', error);
      throw error;
    }
  }
}

export default new UserPreferenceService();