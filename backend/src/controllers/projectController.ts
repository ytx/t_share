import { Request, Response } from 'express';
import { z } from 'zod';
import projectService from '../services/projectService';
import logger from '../utils/logger';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  isPublic: z.boolean().default(true),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  isPublic: z.boolean().optional(),
});

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = createProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const project = await projectService.createProject(userId, validationResult.data);
    res.status(201).json(project);
  } catch (error) {
    logger.error('Create project failed:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const validationResult = updateProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const project = await projectService.updateProject(projectId, userId, validationResult.data);
    res.json(project);
  } catch (error) {
    logger.error('Update project failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to update this project') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    await projectService.deleteProject(projectId, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete project failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to delete this project') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Cannot delete project that contains documents') {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await projectService.getProject(projectId, userId);
    res.json(project);
  } catch (error) {
    logger.error('Get project failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to access this project') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to get project' });
  }
};

export const getUserProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projects = await projectService.getUserProjects(userId);
    res.json({ data: projects });
  } catch (error) {
    logger.error('Get user projects failed:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const adminMode = req.query.adminMode === 'true';
    const projects = await projectService.getAllProjects(userId, adminMode);
    res.json({ data: projects });
  } catch (error) {
    logger.error('Get all projects failed:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};