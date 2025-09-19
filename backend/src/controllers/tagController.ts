import { Response } from 'express';
import tagService from '../services/tagService';
import { tagValidation } from '../utils/validation';
import logger from '../utils/logger';

class TagController {
  async createTag(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Validate request body
      const { error, value } = tagValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const tag = await tagService.createTag((req.user as any).id, value);

      res.status(201).json({
        message: 'Tag created successfully',
        tag,
      });
    } catch (error: any) {
      logger.error('Create tag controller error:', error);

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create tag',
      });
    }
  }

  async updateTag(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const tagId = parseInt(req.params.id);
      if (isNaN(tagId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid tag ID',
        });
      }

      // Validate request body
      const { error, value } = tagValidation.update.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const tag = await tagService.updateTag(tagId, (req.user as any).id, value);

      res.status(200).json({
        message: 'Tag updated successfully',
        tag,
      });
    } catch (error: any) {
      logger.error('Update tag controller error:', error);

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

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update tag',
      });
    }
  }

  async deleteTag(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const tagId = parseInt(req.params.id);
      if (isNaN(tagId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid tag ID',
        });
      }

      await tagService.deleteTag(tagId, (req.user as any).id);

      res.status(200).json({
        message: 'Tag deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete tag controller error:', error);

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

      if (error.message.includes('being used')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete tag',
      });
    }
  }

  async getTag(req: Request, res: Response) {
    try {
      const tagId = parseInt(req.params.id);
      if (isNaN(tagId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid tag ID',
        });
      }

      const tag = await tagService.getTag(tagId);

      res.status(200).json({
        tag,
      });
    } catch (error: any) {
      logger.error('Get tag controller error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get tag',
      });
    }
  }

  async getAllTags(req: Request, res: Response) {
    try {
      const tags = await tagService.getAllTags();

      res.status(200).json({
        tags,
      });
    } catch (error: any) {
      logger.error('Get all tags controller error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get tags',
      });
    }
  }

  async getPopularTags(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tags = await tagService.getPopularTags(limit);

      res.status(200).json({
        tags,
      });
    } catch (error: any) {
      logger.error('Get popular tags controller error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get popular tags',
      });
    }
  }
}

export default new TagController();