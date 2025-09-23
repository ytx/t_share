import logger from '../utils/logger';
import prisma from '../config/database';

export interface TagCreateData {
  name: string;
  description?: string;
  color?: string;
}

export interface TagUpdateData {
  name?: string;
  description?: string;
  color?: string;
}

class TagService {
  async createTag(userId: number, data: TagCreateData) {
    try {
      // Check if tag name already exists
      const existingTag = await prisma.tag.findUnique({
        where: { name: data.name },
      });

      if (existingTag) {
        throw new Error('Tag with this name already exists');
      }

      const tag = await prisma.tag.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color || '#1976d2', // Default blue color
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

      logger.info(`Tag created: ${tag.id} by user ${userId}`);
      return tag;
    } catch (error) {
      logger.error('Create tag failed:', error);
      throw error;
    }
  }

  async updateTag(id: number, userId: number, data: TagUpdateData) {
    try {
      // Check if tag exists
      const existingTag = await prisma.tag.findUnique({
        where: { id },
      });

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // Check authorization (only creator or admin can update)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && existingTag.createdBy !== userId) {
        throw new Error('Not authorized to update this tag');
      }

      // Check if new name conflicts with existing tag
      if (data.name && data.name !== existingTag.name) {
        const nameConflict = await prisma.tag.findUnique({
          where: { name: data.name },
        });

        if (nameConflict && nameConflict.id !== id) {
          throw new Error('Tag with this name already exists');
        }
      }

      const tag = await prisma.tag.update({
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

      logger.info(`Tag updated: ${id} by user ${userId}`);
      return tag;
    } catch (error) {
      logger.error('Update tag failed:', error);
      throw error;
    }
  }

  async deleteTag(id: number, userId: number) {
    try {
      // Check if tag exists
      const tag = await prisma.tag.findUnique({
        where: { id },
        include: {
          templateTags: true,
        },
      });

      if (!tag) {
        throw new Error('Tag not found');
      }

      // Check authorization (only creator or admin can delete)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && tag.createdBy !== userId) {
        throw new Error('Not authorized to delete this tag');
      }

      // Check if tag is being used by templates
      if (tag.templateTags.length > 0) {
        throw new Error('Cannot delete tag that is being used by templates');
      }

      await prisma.tag.delete({
        where: { id },
      });

      logger.info(`Tag deleted: ${id} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Delete tag failed:', error);
      throw error;
    }
  }

  async getTag(id: number) {
    try {
      const tag = await prisma.tag.findUnique({
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
              templateTags: true,
            },
          },
        },
      });

      if (!tag) {
        throw new Error('Tag not found');
      }

      return tag;
    } catch (error) {
      logger.error('Get tag failed:', error);
      throw error;
    }
  }

  async getAllTags() {
    try {
      const tags = await prisma.tag.findMany({
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
              templateTags: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return tags;
    } catch (error) {
      logger.error('Get all tags failed:', error);
      throw error;
    }
  }

  async getPopularTags(limit: number = 10) {
    try {
      const tags = await prisma.tag.findMany({
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
              templateTags: true,
            },
          },
        },
        orderBy: {
          templateTags: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return tags;
    } catch (error) {
      logger.error('Get popular tags failed:', error);
      throw error;
    }
  }
}

export default new TagService();