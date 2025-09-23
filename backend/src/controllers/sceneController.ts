import { Request, Response } from 'express';
import sceneService from '../services/sceneService';
import { sceneValidation } from '../utils/validation';
import logger from '../utils/logger';
import { handleControllerError } from '../utils/errorHandler';

class SceneController {
  async createScene(req: Request, res: Response) {
    try {
      logger.info('Create scene request:', {
        user: req.user ? 'authenticated' : 'not authenticated',
        body: req.body,
        headers: req.headers
      });

      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Validate request body
      const { error, value } = sceneValidation.create.validate(req.body);
      if (error) {
        logger.warn('Scene validation error:', {
          error: error.details[0].message,
          body: req.body,
          value: value
        });
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
        });
      }

      const scene = await sceneService.createScene(req.user!.id, value);

      res.status(201).json({
        message: 'Scene created successfully',
        scene,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Create scene controller', 'Failed to create scene');
    }
  }

  async updateScene(req: Request, res: Response) {
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

      const scene = await sceneService.updateScene(sceneId, req.user!.id, value);

      res.status(200).json({
        message: 'Scene updated successfully',
        scene,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Update scene controller', 'Failed to update scene');
    }
  }

  async deleteScene(req: Request, res: Response) {
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

      await sceneService.deleteScene(sceneId, req.user!.id);

      res.status(200).json({
        message: 'Scene deleted successfully',
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Delete scene controller', 'Failed to delete scene');
    }
  }

  async getScene(req: Request, res: Response) {
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
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Get scene controller', 'Failed to get scene');
    }
  }

  async getAllScenes(_req: Request, res: Response) {
    try {
      const scenes = await sceneService.getAllScenes();

      res.status(200).json({
        scenes,
      });
    } catch (error: unknown) {
      return handleControllerError(error, res, 'Get all scenes controller', 'Failed to get scenes');
    }
  }
}

export default new SceneController();