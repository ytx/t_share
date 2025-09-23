import logger from '../utils/logger';
import prisma from '../config/database';

export interface SceneCreateData {
  name: string;
  description?: string;
}

export interface SceneUpdateData {
  name?: string;
  description?: string;
}

class SceneService {
  async createScene(userId: number, data: SceneCreateData) {
    try {
      // Check if scene name already exists
      const existingScene = await prisma.scene.findFirst({
        where: { name: data.name },
      });

      if (existingScene) {
        throw new Error('Scene with this name already exists');
      }

      const scene = await prisma.scene.create({
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

      logger.info(`Scene created: ${scene.id} by user ${userId}`);
      return scene;
    } catch (error) {
      logger.error('Create scene failed:', error);
      throw error;
    }
  }

  async updateScene(id: number, userId: number, data: SceneUpdateData) {
    try {
      // Check if scene exists
      const existingScene = await prisma.scene.findUnique({
        where: { id },
      });

      if (!existingScene) {
        throw new Error('Scene not found');
      }

      // Check authorization (only creator or admin can update)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && existingScene.createdBy !== userId) {
        throw new Error('Not authorized to update this scene');
      }

      // Check if new name conflicts with existing scene
      if (data.name && data.name !== existingScene.name) {
        const nameConflict = await prisma.scene.findFirst({
          where: {
            name: data.name,
            NOT: { id },
          },
        });

        if (nameConflict) {
          throw new Error('Scene with this name already exists');
        }
      }

      const scene = await prisma.scene.update({
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

      logger.info(`Scene updated: ${id} by user ${userId}`);
      return scene;
    } catch (error) {
      logger.error('Update scene failed:', error);
      throw error;
    }
  }

  async deleteScene(id: number, userId: number) {
    try {
      // Check if scene exists
      const scene = await prisma.scene.findUnique({
        where: { id },
        include: {
          templates: true,
        },
      });

      if (!scene) {
        throw new Error('Scene not found');
      }

      // Check authorization (only creator or admin can delete)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && scene.createdBy !== userId) {
        throw new Error('Not authorized to delete this scene');
      }

      // Check if scene is being used by templates
      if (scene.templates.length > 0) {
        throw new Error('Cannot delete scene that is being used by templates');
      }

      await prisma.scene.delete({
        where: { id },
      });

      logger.info(`Scene deleted: ${id} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Delete scene failed:', error);
      throw error;
    }
  }

  async getScene(id: number) {
    try {
      const scene = await prisma.scene.findUnique({
        where: { id },
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
              templates: true,
            },
          },
        },
      });

      if (!scene) {
        throw new Error('Scene not found');
      }

      return scene;
    } catch (error) {
      logger.error('Get scene failed:', error);
      throw error;
    }
  }

  async getAllScenes() {
    try {
      const scenes = await prisma.scene.findMany({
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
              templates: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return scenes;
    } catch (error) {
      logger.error('Get all scenes failed:', error);
      throw error;
    }
  }
}

export default new SceneService();