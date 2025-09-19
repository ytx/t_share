import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface UserVariableCreateData {
  name: string;
  value: string;
  description?: string;
}

export interface UserVariableUpdateData {
  name?: string;
  value?: string;
  description?: string;
}

class UserVariableService {
  async createUserVariable(userId: number, data: UserVariableCreateData) {
    try {
      // Check if variable name already exists for this user
      const existingVariable = await prisma.userVariable.findFirst({
        where: {
          userId,
          name: data.name,
        },
      });

      if (existingVariable) {
        throw new Error('Variable name already exists for this user');
      }

      const userVariable = await prisma.userVariable.create({
        data: {
          name: data.name,
          value: data.value,
          description: data.description,
          userId,
        },
      });

      logger.info(`User variable created: ${userVariable.id} by user ${userId}`);
      return userVariable;
    } catch (error) {
      logger.error('Create user variable failed:', error);
      throw error;
    }
  }

  async updateUserVariable(id: number, userId: number, data: UserVariableUpdateData) {
    try {
      // Check if variable exists and user owns it
      const existingVariable = await prisma.userVariable.findUnique({
        where: { id },
      });

      if (!existingVariable) {
        throw new Error('User variable not found');
      }

      if (existingVariable.userId !== userId) {
        throw new Error('Not authorized to update this variable');
      }

      // Check for name conflicts if name is being updated
      if (data.name && data.name !== existingVariable.name) {
        const conflictingVariable = await prisma.userVariable.findFirst({
          where: {
            userId,
            name: data.name,
            id: { not: id },
          },
        });

        if (conflictingVariable) {
          throw new Error('Variable name already exists for this user');
        }
      }

      const userVariable = await prisma.userVariable.update({
        where: { id },
        data,
      });

      logger.info(`User variable updated: ${id} by user ${userId}`);
      return userVariable;
    } catch (error) {
      logger.error('Update user variable failed:', error);
      throw error;
    }
  }

  async deleteUserVariable(id: number, userId: number) {
    try {
      // Check if variable exists and user owns it
      const existingVariable = await prisma.userVariable.findUnique({
        where: { id },
      });

      if (!existingVariable) {
        throw new Error('User variable not found');
      }

      if (existingVariable.userId !== userId) {
        throw new Error('Not authorized to delete this variable');
      }

      await prisma.userVariable.delete({
        where: { id },
      });

      logger.info(`User variable deleted: ${id} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Delete user variable failed:', error);
      throw error;
    }
  }

  async getUserVariable(id: number, userId: number) {
    try {
      const userVariable = await prisma.userVariable.findUnique({
        where: { id },
      });

      if (!userVariable) {
        throw new Error('User variable not found');
      }

      if (userVariable.userId !== userId) {
        throw new Error('Not authorized to access this variable');
      }

      return userVariable;
    } catch (error) {
      logger.error('Get user variable failed:', error);
      throw error;
    }
  }

  async getUserVariables(userId: number) {
    try {
      const userVariables = await prisma.userVariable.findMany({
        where: { userId },
        orderBy: [
          { name: 'asc' },
        ],
      });

      return userVariables;
    } catch (error) {
      logger.error('Get user variables failed:', error);
      throw error;
    }
  }

  async getUserVariablesAsMap(userId: number): Promise<Record<string, string>> {
    try {
      const userVariables = await this.getUserVariables(userId);
      const variableMap: Record<string, string> = {};

      userVariables.forEach(variable => {
        variableMap[variable.name] = variable.value;
      });

      return variableMap;
    } catch (error) {
      logger.error('Get user variables map failed:', error);
      throw error;
    }
  }

  async bulkCreateUserVariables(userId: number, variables: UserVariableCreateData[]) {
    try {
      // Check for duplicate names in the input
      const names = variables.map(v => v.name);
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        throw new Error('Duplicate variable names in input');
      }

      // Check for existing variables
      const existingVariables = await prisma.userVariable.findMany({
        where: {
          userId,
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
          prisma.userVariable.create({
            data: {
              name: variable.name,
              value: variable.value,
              description: variable.description,
              userId,
            },
          })
        )
      );

      logger.info(`Bulk created ${createdVariables.length} user variables for user ${userId}`);
      return createdVariables;
    } catch (error) {
      logger.error('Bulk create user variables failed:', error);
      throw error;
    }
  }
}

export default new UserVariableService();