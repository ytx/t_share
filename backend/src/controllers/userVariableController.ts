import { Request, Response } from 'express';
import { z } from 'zod';
import userVariableService from '../services/userVariableService';
import logger from '../utils/logger';

const createUserVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required').max(50, 'Variable name too long'),
  value: z.string().max(1000, 'Variable value too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

const updateUserVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required').max(50, 'Variable name too long').optional(),
  value: z.string().max(1000, 'Variable value too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

const bulkCreateUserVariablesSchema = z.object({
  variables: z.array(createUserVariableSchema).min(1, 'At least one variable is required').max(50, 'Too many variables'),
});

export const createUserVariable = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = createUserVariableSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const userVariable = await userVariableService.createUserVariable(userId, validationResult.data);
    res.status(201).json(userVariable);
  } catch (error) {
    logger.error('Create user variable failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Variable name already exists for this user') {
        return res.status(409).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to create user variable' });
  }
};

export const updateUserVariable = async (req: Request, res: Response) => {
  try {
    const variableId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(variableId)) {
      return res.status(400).json({ error: 'Invalid variable ID' });
    }

    const validationResult = updateUserVariableSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const userVariable = await userVariableService.updateUserVariable(variableId, userId, validationResult.data);
    res.json(userVariable);
  } catch (error) {
    logger.error('Update user variable failed:', error);
    if (error instanceof Error) {
      if (error.message === 'User variable not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to update this variable') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Variable name already exists for this user') {
        return res.status(409).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to update user variable' });
  }
};

export const deleteUserVariable = async (req: Request, res: Response) => {
  try {
    const variableId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(variableId)) {
      return res.status(400).json({ error: 'Invalid variable ID' });
    }

    await userVariableService.deleteUserVariable(variableId, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete user variable failed:', error);
    if (error instanceof Error) {
      if (error.message === 'User variable not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to delete this variable') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to delete user variable' });
  }
};

export const getUserVariable = async (req: Request, res: Response) => {
  try {
    const variableId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(variableId)) {
      return res.status(400).json({ error: 'Invalid variable ID' });
    }

    const userVariable = await userVariableService.getUserVariable(variableId, userId);
    res.json(userVariable);
  } catch (error) {
    logger.error('Get user variable failed:', error);
    if (error instanceof Error) {
      if (error.message === 'User variable not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to access this variable') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to get user variable' });
  }
};

export const getUserVariables = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userVariables = await userVariableService.getUserVariables(userId);
    res.json({ data: userVariables });
  } catch (error) {
    logger.error('Get user variables failed:', error);
    res.status(500).json({ error: 'Failed to get user variables' });
  }
};

export const bulkCreateUserVariables = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = bulkCreateUserVariablesSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const userVariables = await userVariableService.bulkCreateUserVariables(userId, validationResult.data.variables);
    res.status(201).json({ data: userVariables });
  } catch (error) {
    logger.error('Bulk create user variables failed:', error);
    if (error instanceof Error) {
      if (error.message.includes('Duplicate variable names') || error.message.includes('Variables already exist')) {
        return res.status(409).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to create user variables' });
  }
};