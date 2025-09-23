import { Request, Response } from 'express';
import tagService from '../services/tagService';
import { tagValidation } from '../utils/validation';
import { handleControllerError } from '../utils/errorHandler';

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

      const tag = await tagService.createTag(req.user!.id, value);

      res.status(201).json({
        message: 'Tag created successfully',
        tag,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Create tag controller', 'Failed to create tag');
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

      const tag = await tagService.updateTag(tagId, req.user!.id, value);

      res.status(200).json({
        message: 'Tag updated successfully',
        tag,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Update tag controller', 'Failed to update tag');
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

      await tagService.deleteTag(tagId, req.user!.id);

      res.status(200).json({
        message: 'Tag deleted successfully',
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Delete tag controller', 'Failed to delete tag');
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
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Get tag controller', 'Failed to get tag');
    }
  }

  async getAllTags(_req: Request, res: Response) {
    try {
      const tags = await tagService.getAllTags();

      res.status(200).json({
        tags,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Get all tags controller', 'Failed to get tags');
    }
  }

  async getPopularTags(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tags = await tagService.getPopularTags(limit);

      res.status(200).json({
        tags,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Get popular tags controller', 'Failed to get popular tags');
    }
  }
}

export default new TagController();