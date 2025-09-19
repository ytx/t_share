import { Response } from 'express';
import sceneService from '../services/sceneService';
import { sceneValidation } from '../utils/validation';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

class SceneController {
  async createScene(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Validate request body
      const { error, value } = sceneValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const scene = await sceneService.createScene(req.user.id, value);

      res.status(201).json({
        message: 'Scene created successfully',
        scene,
      });
    } catch (error: any) {
      logger.error('Create scene controller error:', error);

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create scene',
      });
    }
  }

  async updateScene(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const sceneId = parseInt(req.params.id);
      if (isNaN(sceneId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid scene ID',
        });
      }

      // Validate request body
      const { error, value } = sceneValidation.update.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const scene = await sceneService.updateScene(sceneId, req.user.id, value);

      res.status(200).json({
        message: 'Scene updated successfully',
        scene,
      });
    } catch (error: any) {
      logger.error('Update scene controller error:', error);

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
        message: 'Failed to update scene',
      });
    }
  }

  async deleteScene(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const sceneId = parseInt(req.params.id);
      if (isNaN(sceneId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid scene ID',
        });
      }

      await sceneService.deleteScene(sceneId, req.user.id);

      res.status(200).json({
        message: 'Scene deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete scene controller error:', error);

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
        message: 'Failed to delete scene',
      });
    }
  }

  async getScene(req: AuthenticatedRequest, res: Response) {
    try {
      const sceneId = parseInt(req.params.id);
      if (isNaN(sceneId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid scene ID',
        });
      }

      const scene = await sceneService.getScene(sceneId);

      res.status(200).json({
        scene,
      });
    } catch (error: any) {
      logger.error('Get scene controller error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get scene',
      });
    }
  }

  async getAllScenes(req: AuthenticatedRequest, res: Response) {
    try {
      const scenes = await sceneService.getAllScenes();

      res.status(200).json({
        scenes,
      });
    } catch (error: any) {
      logger.error('Get all scenes controller error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get scenes',
      });
    }
  }
}

export default new SceneController();