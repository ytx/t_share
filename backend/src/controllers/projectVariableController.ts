import { Request, Response } from 'express';
import { z } from 'zod';
import projectVariableService from '../services/projectVariableService';
import logger from '../utils/logger';

const createProjectVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required').max(50, 'Variable name too long'),
  value: z.string().max(1000, 'Variable value too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

const updateProjectVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required').max(50, 'Variable name too long').optional(),
  value: z.string().max(1000, 'Variable value too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

const bulkCreateProjectVariablesSchema = z.object({
  variables: z.array(createProjectVariableSchema).min(1, 'At least one variable is required').max(50, 'Too many variables'),
});

export const createProjectVariable = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const validationResult = createProjectVariableSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const projectVariable = await projectVariableService.createProjectVariable(projectId, userId, validationResult.data);
    res.status(201).json(projectVariable);
  } catch (error) {
    logger.error('Create project variable failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to manage variables for this project') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Variable name already exists for this project') {
        return res.status(409).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to create project variable' });
  }
};

export const updateProjectVariable = async (req: Request, res: Response) => {
  try {
    const variableId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(variableId)) {
      return res.status(400).json({ error: 'Invalid variable ID' });
    }

    const validationResult = updateProjectVariableSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const projectVariable = await projectVariableService.updateProjectVariable(variableId, userId, validationResult.data);
    res.json(projectVariable);
  } catch (error) {
    logger.error('Update project variable failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project variable not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to update this variable') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Variable name already exists for this project') {
        return res.status(409).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to update project variable' });
  }
};

export const deleteProjectVariable = async (req: Request, res: Response) => {
  try {
    const variableId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(variableId)) {
      return res.status(400).json({ error: 'Invalid variable ID' });
    }

    await projectVariableService.deleteProjectVariable(variableId, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete project variable failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project variable not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to delete this variable') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to delete project variable' });
  }
};

export const getProjectVariable = async (req: Request, res: Response) => {
  try {
    const variableId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(variableId)) {
      return res.status(400).json({ error: 'Invalid variable ID' });
    }

    const projectVariable = await projectVariableService.getProjectVariable(variableId, userId);
    res.json(projectVariable);
  } catch (error) {
    logger.error('Get project variable failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project variable not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to access this variable') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to get project variable' });
  }
};

export const getProjectVariables = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const projectVariables = await projectVariableService.getProjectVariables(projectId, userId);
    res.json({ data: projectVariables });
  } catch (error) {
    logger.error('Get project variables failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to access variables for this project') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to get project variables' });
  }
};

export const bulkCreateProjectVariables = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const validationResult = bulkCreateProjectVariablesSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const projectVariables = await projectVariableService.bulkCreateProjectVariables(projectId, userId, validationResult.data.variables);
    res.status(201).json({ data: projectVariables });
  } catch (error) {
    logger.error('Bulk create project variables failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to manage variables for this project') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('Duplicate variable names') || error.message.includes('Variables already exist')) {
        return res.status(409).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to create project variables' });
  }
};