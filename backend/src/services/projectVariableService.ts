import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface ProjectVariableCreateData {
  name: string;
  value: string;
  description?: string;
}

export interface ProjectVariableUpdateData {
  name?: string;
  value?: string;
  description?: string;
}

class ProjectVariableService {
  async createProjectVariable(projectId: number, userId: number, data: ProjectVariableCreateData) {
    try {
      // Check if project exists and user has access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && project.createdBy !== userId) {
        throw new Error('Not authorized to manage variables for this project');
      }

      // Check if variable name already exists for this project
      const existingVariable = await prisma.projectVariable.findFirst({
        where: {
          projectId,
          name: data.name,
        },
      });

      if (existingVariable) {
        throw new Error('Variable name already exists for this project');
      }

      const projectVariable = await prisma.projectVariable.create({
        data: {
          name: data.name,
          value: data.value,
          description: data.description,
          projectId,
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
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info(`Project variable created: ${projectVariable.id} for project ${projectId} by user ${userId}`);
      return projectVariable;
    } catch (error) {
      logger.error('Create project variable failed:', error);
      throw error;
    }
  }

  async updateProjectVariable(id: number, userId: number, data: ProjectVariableUpdateData) {
    try {
      // Check if variable exists
      const existingVariable = await prisma.projectVariable.findUnique({
        where: { id },
        include: {
          project: true,
        },
      });

      if (!existingVariable) {
        throw new Error('Project variable not found');
      }

      // Check if user has access to the project
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && existingVariable.project.createdBy !== userId) {
        throw new Error('Not authorized to update this variable');
      }

      // Check for name conflicts if name is being updated
      if (data.name && data.name !== existingVariable.name) {
        const conflictingVariable = await prisma.projectVariable.findFirst({
          where: {
            projectId: existingVariable.projectId,
            name: data.name,
            id: { not: id },
          },
        });

        if (conflictingVariable) {
          throw new Error('Variable name already exists for this project');
        }
      }

      const projectVariable = await prisma.projectVariable.update({
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
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info(`Project variable updated: ${id} by user ${userId}`);
      return projectVariable;
    } catch (error) {
      logger.error('Update project variable failed:', error);
      throw error;
    }
  }

  async deleteProjectVariable(id: number, userId: number) {
    try {
      // Check if variable exists
      const existingVariable = await prisma.projectVariable.findUnique({
        where: { id },
        include: {
          project: true,
        },
      });

      if (!existingVariable) {
        throw new Error('Project variable not found');
      }

      // Check if user has access to the project
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && existingVariable.project.createdBy !== userId) {
        throw new Error('Not authorized to delete this variable');
      }

      await prisma.projectVariable.delete({
        where: { id },
      });

      logger.info(`Project variable deleted: ${id} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Delete project variable failed:', error);
      throw error;
    }
  }

  async getProjectVariable(id: number, userId: number) {
    try {
      const projectVariable = await prisma.projectVariable.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!projectVariable) {
        throw new Error('Project variable not found');
      }

      // Check if user has access to the project
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && projectVariable.project && projectVariable.project.id) {
        const project = await prisma.project.findUnique({
          where: { id: projectVariable.project.id },
        });

        if (project && project.createdBy !== userId) {
          throw new Error('Not authorized to access this variable');
        }
      }

      return projectVariable;
    } catch (error) {
      logger.error('Get project variable failed:', error);
      throw error;
    }
  }

  async getProjectVariables(projectId: number, userId: number) {
    try {
      // Check if project exists and user has access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && project.createdBy !== userId) {
        throw new Error('Not authorized to access variables for this project');
      }

      const projectVariables = await prisma.projectVariable.findMany({
        where: { projectId },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
        },
        orderBy: [
          { name: 'asc' },
        ],
      });

      return projectVariables;
    } catch (error) {
      logger.error('Get project variables failed:', error);
      throw error;
    }
  }

  async getProjectVariablesAsMap(projectId: number, userId: number): Promise<Record<string, string>> {
    try {
      const projectVariables = await this.getProjectVariables(projectId, userId);
      const variableMap: Record<string, string> = {};

      projectVariables.forEach(variable => {
        variableMap[variable.name] = variable.value;
      });

      return variableMap;
    } catch (error) {
      logger.error('Get project variables map failed:', error);
      throw error;
    }
  }

  async bulkCreateProjectVariables(projectId: number, userId: number, variables: ProjectVariableCreateData[]) {
    try {
      // Check if project exists and user has access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && project.createdBy !== userId) {
        throw new Error('Not authorized to manage variables for this project');
      }

      // Check for duplicate names in the input
      const names = variables.map(v => v.name);
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        throw new Error('Duplicate variable names in input');
      }

      // Check for existing variables
      const existingVariables = await prisma.projectVariable.findMany({
        where: {
          projectId,
          name: { in: names },
        },
      });

      if (existingVariables.length > 0) {
        const existingNames = existingVariables.map(v => v.name);
        throw new Error(`Variables already exist: ${existingNames.join(', ')}`);
      }

      // Create all variables in a transaction
      const createdVariables = await prisma.$transaction(
        variables.map(variable =>
          prisma.projectVariable.create({
            data: {
              name: variable.name,
              value: variable.value,
              description: variable.description,
              projectId,
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
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        )
      );

      logger.info(`Bulk created ${createdVariables.length} project variables for project ${projectId} by user ${userId}`);
      return createdVariables;
    } catch (error) {
      logger.error('Bulk create project variables failed:', error);
      throw error;
    }
  }
}

export default new ProjectVariableService();