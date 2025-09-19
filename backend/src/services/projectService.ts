import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface ProjectCreateData {
  name: string;
  description?: string;
}

export interface ProjectUpdateData {
  name?: string;
  description?: string;
}

class ProjectService {
  async createProject(userId: number, data: ProjectCreateData) {
    try {
      const project = await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
        },
      });

      logger.info(`Project created: ${project.id} by user ${userId}`);
      return project;
    } catch (error) {
      logger.error('Create project failed:', error);
      throw error;
    }
  }

  async updateProject(id: number, userId: number, data: ProjectUpdateData) {
    try {
      // Check if project exists and user is the creator
      const existingProject = await prisma.project.findUnique({
        where: { id },
      });

      if (!existingProject) {
        throw new Error('Project not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && existingProject.createdBy !== userId) {
        throw new Error('Not authorized to update this project');
      }

      const project = await prisma.project.update({
        where: { id },
        data,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
        },
      });

      logger.info(`Project updated: ${id} by user ${userId}`);
      return project;
    } catch (error) {
      logger.error('Update project failed:', error);
      throw error;
    }
  }

  async deleteProject(id: number, userId: number) {
    try {
      // Check if project exists and user is the creator
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          documents: true,
          projectVariables: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && project.createdBy !== userId) {
        throw new Error('Not authorized to delete this project');
      }

      // Check if project has documents
      if (project.documents.length > 0) {
        throw new Error('Cannot delete project that contains documents');
      }

      await prisma.project.delete({
        where: { id },
      });

      logger.info(`Project deleted: ${id} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Delete project failed:', error);
      throw error;
    }
  }

  async getProject(id: number, userId?: number) {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
          projectVariables: {
            include: {
              creator: {
                select: {
                  id: true,
                  displayName: true,
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Check access permissions (for now, any authenticated user can view projects)
      // In the future, this could be expanded to include project members

      return project;
    } catch (error) {
      logger.error('Get project failed:', error);
      throw error;
    }
  }

  async getUserProjects(userId: number) {
    try {
      const projects = await prisma.project.findMany({
        where: {
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
          _count: {
            select: {
              documents: true,
              projectVariables: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return projects;
    } catch (error) {
      logger.error('Get user projects failed:', error);
      throw error;
    }
  }

  async getAllProjects(userId?: number) {
    try {
      // For now, return all projects (in the future, this could be filtered by access permissions)
      const projects = await prisma.project.findMany({
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return projects;
    } catch (error) {
      logger.error('Get all projects failed:', error);
      throw error;
    }
  }
}

export default new ProjectService();