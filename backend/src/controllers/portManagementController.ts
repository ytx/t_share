import { Request, Response } from 'express';
import portManagementService, { PORT_VARIABLE_NAMES } from '../services/portManagementService';
import { handleControllerError } from '../utils/errorHandler';
import { z } from 'zod';

// Validation schemas
const updatePortSchema = z.object({
  variableName: z.enum([
    PORT_VARIABLE_NAMES.FRONTEND_DEV,
    PORT_VARIABLE_NAMES.BACKEND_DEV,
    PORT_VARIABLE_NAMES.DATABASE_DEV,
    PORT_VARIABLE_NAMES.FRONTEND_DOCKER,
    PORT_VARIABLE_NAMES.BACKEND_DOCKER,
    PORT_VARIABLE_NAMES.DATABASE_DOCKER,
  ]),
  port: z.number().int().min(1).max(65535),
});

/**
 * Get project ports
 */
export const getProjectPorts = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(projectId)) {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }

    const ports = await portManagementService.getProjectPorts(projectId);
    res.json({ data: ports });
  } catch (error: unknown) {
    handleControllerError(error, res, 'Get project ports failed');
  }
};

/**
 * Update project port
 */
export const updateProjectPort = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(projectId)) {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }

    // Validate request body
    const validation = updatePortSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.issues
      });
      return;
    }

    const { variableName, port } = validation.data;

    const result = await portManagementService.updatePortVariable(
      projectId,
      variableName,
      port
    );

    if (!result.success) {
      res.status(409).json({ error: result.error });
      return;
    }

    res.json({ data: { success: true } });
  } catch (error: unknown) {
    handleControllerError(error, res, 'Update project port failed');
  }
};

/**
 * Check port conflict
 */
export const checkPortConflict = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const { variableName, port } = req.query;

    if (isNaN(projectId)) {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }

    if (!variableName || !port) {
      res.status(400).json({ error: 'variableName and port are required' });
      return;
    }

    const portNumber = parseInt(port as string, 10);
    if (isNaN(portNumber)) {
      res.status(400).json({ error: 'Invalid port number' });
      return;
    }

    const hasConflict = await portManagementService.checkPortConflict(
      projectId,
      variableName as any,
      portNumber
    );

    res.json({ data: { hasConflict } });
  } catch (error: unknown) {
    handleControllerError(error, res, 'Check port conflict failed');
  }
};

/**
 * Get all port usage (admin only)
 */
export const getAllPortUsage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const portUsage = await portManagementService.getAllPortUsage();
    res.json({ data: portUsage });
  } catch (error: unknown) {
    handleControllerError(error, res, 'Get all port usage failed');
  }
};
