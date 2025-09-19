import { Response } from 'express';
import templateService from '../services/templateService';
import { templateValidation } from '../utils/validation';
import logger from '../utils/logger';

class TemplateController {
  async createTemplate(req: Request, res: Response) {
    try {
      logger.info('Create template request:', {
        user: req.user ? 'authenticated' : 'not authenticated',
        body: req.body
      });

      if (!req.user) {
        logger.warn('Create template: No user authenticated');
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Validate request body
      const { error, value } = templateValidation.create.validate(req.body);
      if (error) {
        logger.warn('Create template validation error:', error.details[0].message);
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const template = await templateService.createTemplate((req.user as any).id, value);

      res.status(201).json({
        message: 'Template created successfully',
        template,
      });
    } catch (error: any) {
      logger.error('Create template controller error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create template',
      });
    }
  }

  async updateTemplate(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID',
        });
      }

      // Validate request body
      const { error, value } = templateValidation.update.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const template = await templateService.updateTemplate(templateId, (req.user as any).id, value);

      res.status(200).json({
        message: 'Template updated successfully',
        template,
      });
    } catch (error: any) {
      logger.error('Update template controller error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message.includes('Not authorized')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update template',
      });
    }
  }

  async deleteTemplate(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID',
        });
      }

      await templateService.deleteTemplate(templateId, (req.user as any).id);

      res.status(200).json({
        message: 'Template deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete template controller error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message.includes('Not authorized')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete template',
      });
    }
  }

  async getTemplate(req: Request, res: Response) {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID',
        });
      }

      const template = await templateService.getTemplate(templateId, req.user?.id);

      res.status(200).json({
        template,
      });
    } catch (error: any) {
      logger.error('Get template controller error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message.includes('Not authorized')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get template',
      });
    }
  }

  async searchTemplates(req: Request, res: Response) {
    try {
      // Validate query parameters
      const { error, value } = templateValidation.search.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      // Convert tagIds from string to array of numbers if provided
      if (value.tagIds && typeof value.tagIds === 'string') {
        if (value.tagIds.trim() === '') {
          value.tagIds = [];
        } else {
          value.tagIds = value.tagIds.split(',').map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));
        }
      }

      // Convert excludedTagIds from string to array of numbers if provided
      if (value.excludedTagIds && typeof value.excludedTagIds === 'string') {
        if (value.excludedTagIds.trim() === '') {
          value.excludedTagIds = [];
        } else {
          value.excludedTagIds = value.excludedTagIds.split(',').map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));
        }
      }

      const result = await templateService.searchTemplates({
        ...value,
        userId: req.user?.id,
      });

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Search templates controller error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search templates',
      });
    }
  }

  async useTemplate(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID',
        });
      }

      await templateService.useTemplate(templateId, (req.user as any).id);

      res.status(200).json({
        message: 'Template usage recorded successfully',
      });
    } catch (error: any) {
      logger.error('Use template controller error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to record template usage',
      });
    }
  }

  async getTemplateVersions(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID',
        });
      }

      const versions = await templateService.getTemplateVersions(templateId, (req.user as any).id);

      res.status(200).json({
        versions,
      });
    } catch (error: any) {
      logger.error('Get template versions controller error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message.includes('Not authorized')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get template versions',
      });
    }
  }

  async restoreTemplateVersion(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const templateId = parseInt(req.params.id);
      const versionNumber = parseInt(req.params.version);

      if (isNaN(templateId) || isNaN(versionNumber)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID or version number',
        });
      }

      // Get the version to restore
      const version = await templateService.getTemplateVersions(templateId, (req.user as any).id);
      const targetVersion = version.find(v => v.versionNumber === versionNumber);

      if (!targetVersion) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Template version not found',
        });
      }

      // Update template with version data
      const template = await templateService.updateTemplate(templateId, (req.user as any).id, {
        title: targetVersion.title,
        content: targetVersion.content,
        description: targetVersion.description,
        sceneId: targetVersion.sceneId,
        status: targetVersion.status,
      });

      res.status(200).json({
        message: `Template restored to version ${versionNumber}`,
        template,
      });
    } catch (error: any) {
      logger.error('Restore template version controller error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message.includes('Not authorized')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to restore template version',
      });
    }
  }
}

export default new TemplateController();