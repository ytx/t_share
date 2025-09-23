import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import prisma from '../config/database';

export interface TemplateCreateData {
  title: string;
  content: string;
  description?: string;
  sceneId?: number;
  status?: string;
  isPublic?: boolean;
  tagIds?: number[];
}

export interface TemplateUpdateData {
  title?: string;
  content?: string;
  description?: string;
  sceneId?: number;
  status?: string;
  isPublic?: boolean;
  tagIds?: number[];
}

export interface TemplateSearchOptions {
  keyword?: string;
  sceneId?: number;
  createdBy?: string;
  status?: string;
  tagIds?: number[];
  excludedTagIds?: number[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
  userId?: number; // for filtering user's own templates
  adminMode?: boolean; // for admin users to see all templates
}

class TemplateService {
  // Helper method to generate title from content
  private generateTitleFromContent(content: string): string {
    const lines = content.split('\n');
    const firstNonEmptyLine = lines.find(line => line.trim() !== '');
    return firstNonEmptyLine ? firstNonEmptyLine.trim() : '無題の定型文';
  }

  async createTemplate(userId: number, data: TemplateCreateData) {
    try {
      // Generate title if not provided
      const title = data.title && data.title.trim()
        ? data.title.trim()
        : this.generateTitleFromContent(data.content);

      const result = await prisma.$transaction(async (tx) => {
        // Create template
        const template = await tx.template.create({
          data: {
            title,
            content: data.content,
            description: data.description,
            sceneId: data.sceneId,
            status: data.status || 'draft',
            isPublic: data.isPublic ?? true,
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
            scene: true,
            templateTags: {
              include: {
                tag: true,
              },
            },
          },
        });

        // Create initial version
        await tx.templateVersion.create({
          data: {
            templateId: template.id,
            versionNumber: 1,
            title: template.title,
            content: template.content,
            description: template.description,
            sceneId: template.sceneId,
            status: template.status,
            createdBy: userId,
          },
        });

        // Add tags if provided
        if (data.tagIds && data.tagIds.length > 0) {
          await tx.templateTag.createMany({
            data: data.tagIds.map(tagId => ({
              templateId: template.id,
              tagId,
            })),
          });

          // Refetch template with tags
          return await tx.template.findUnique({
            where: { id: template.id },
            include: {
              creator: {
                select: {
                  id: true,
                  displayName: true,
                  username: true,
                },
              },
              scene: true,
              templateTags: {
                include: {
                  tag: true,
                },
              },
            },
          });
        }

        return template;
      });

      logger.info(`Template created: ${result?.id} by user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Create template failed:', error);
      throw error;
    }
  }

  async updateTemplate(id: number, userId: number, data: TemplateUpdateData) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Check if user owns the template or is admin
        const existingTemplate = await tx.template.findUnique({
          where: { id },
          include: { creator: true },
        });

        if (!existingTemplate) {
          throw new Error('Template not found');
        }

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user?.isAdmin && existingTemplate.createdBy !== userId) {
          throw new Error('Not authorized to update this template');
        }

        // Get current version number
        const latestVersion = await tx.templateVersion.findFirst({
          where: { templateId: id },
          orderBy: { versionNumber: 'desc' },
        });

        const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

        // Update template
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.description !== undefined) updateData.description = data.description;
        // sceneId can be null to unset the scene
        if ('sceneId' in data) updateData.sceneId = data.sceneId;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

        const updatedTemplate = await tx.template.update({
          where: { id },
          data: updateData,
        });

        // Create new version if content changed
        if (data.title || data.content || data.description) {
          await tx.templateVersion.create({
            data: {
              templateId: id,
              versionNumber: nextVersionNumber,
              title: updatedTemplate.title,
              content: updatedTemplate.content,
              description: updatedTemplate.description,
              sceneId: updatedTemplate.sceneId,
              status: updatedTemplate.status,
              createdBy: userId,
            },
          });
        }

        // Update tags if provided
        if (data.tagIds !== undefined) {
          // Remove existing tags
          await tx.templateTag.deleteMany({
            where: { templateId: id },
          });

          // Add new tags
          if (data.tagIds.length > 0) {
            await tx.templateTag.createMany({
              data: data.tagIds.map(tagId => ({
                templateId: id,
                tagId,
              })),
            });
          }
        }

        // Return updated template with relations
        return await tx.template.findUnique({
          where: { id },
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
            scene: true,
            templateTags: {
              include: {
                tag: true,
              },
            },
          },
        });
      });

      logger.info(`Template updated: ${id} by user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Update template failed:', error);
      throw error;
    }
  }

  async deleteTemplate(id: number, userId: number) {
    try {
      // Check if user owns the template or is admin
      const template = await prisma.template.findUnique({
        where: { id },
        include: { creator: true },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && template.createdBy !== userId) {
        throw new Error('Not authorized to delete this template');
      }

      // Delete template (cascade will handle related records)
      await prisma.template.delete({
        where: { id },
      });

      logger.info(`Template deleted: ${id} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Delete template failed:', error);
      throw error;
    }
  }

  async getTemplate(id: number, userId?: number) {
    try {
      const template = await prisma.template.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
          scene: true,
          templateTags: {
            include: {
              tag: true,
            },
          },
          templateUsage: userId ? {
            where: { userId },
          } : false,
        },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Check if user can access this template
      if (!template.isPublic && (!userId || template.createdBy !== userId)) {
        const user = await prisma.user.findUnique({ where: { id: userId || 0 } });
        if (!user?.isAdmin) {
          throw new Error('Not authorized to access this template');
        }
      }

      return template;
    } catch (error) {
      logger.error('Get template failed:', error);
      throw error;
    }
  }

  async searchTemplates(options: TemplateSearchOptions) {
    try {
      const {
        keyword,
        sceneId,
        createdBy,
        status = 'active',
        tagIds,
        excludedTagIds,
        sortBy = 'updated',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
        userId,
        adminMode = false,
      } = options;

      // Build where clause
      const where: Prisma.TemplateWhereInput = {
        AND: [
          // Status filter
          status === 'active' ? { status: 'published' } : {},

          // Keyword search
          keyword ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
              { content: { contains: keyword, mode: 'insensitive' } },
            ],
          } : {},

          // Scene filter - include templates with matching sceneId OR no sceneId
          sceneId ? {
            OR: [
              { sceneId },
              { sceneId: null },
            ],
          } : {},

          // Creator filter
          createdBy ? {
            creator: {
              OR: [
                { username: { contains: createdBy, mode: 'insensitive' } },
                { displayName: { contains: createdBy, mode: 'insensitive' } },
              ],
            },
          } : {},

          // Tag filter - include tags
          tagIds && tagIds.length > 0 ? {
            templateTags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          } : {},

          // Tag filter - exclude tags
          excludedTagIds && excludedTagIds.length > 0 ? {
            NOT: {
              templateTags: {
                some: {
                  tagId: { in: excludedTagIds },
                },
              },
            },
          } : {},

          // Access control - admin mode shows all templates, otherwise show public templates or user's own templates
          adminMode ? {} : (userId ? {
            OR: [
              { isPublic: true },
              { createdBy: userId },
            ],
          } : { isPublic: true }),
        ],
      };

      // Build order by clause
      let orderBy: Prisma.TemplateOrderByWithRelationInput = {};
      switch (sortBy) {
        case 'lastUsed':
          // This would require a complex query with template usage
          // For now, fall back to updated
          orderBy = { updatedAt: sortOrder as 'asc' | 'desc' };
          break;
        case 'created':
          orderBy = { createdAt: sortOrder as 'asc' | 'desc' };
          break;
        case 'updated':
        default:
          orderBy = { updatedAt: sortOrder as 'asc' | 'desc' };
          break;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [templates, total] = await Promise.all([
        prisma.template.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
            scene: true,
            templateTags: {
              include: {
                tag: true,
              },
            },
            templateUsage: userId ? {
              where: { userId },
            } : false,
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.template.count({ where }),
      ]);

      return {
        data: templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Search templates failed:', error);
      throw error;
    }
  }

  async useTemplate(templateId: number, userId: number) {
    try {
      // Update or create template usage record
      await prisma.templateUsage.upsert({
        where: {
          templateId_userId: {
            templateId,
            userId,
          },
        },
        update: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
        create: {
          templateId,
          userId,
          usageCount: 1,
          lastUsedAt: new Date(),
        },
      });

      logger.info(`Template used: ${templateId} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Use template failed:', error);
      throw error;
    }
  }

  async getTemplateVersions(templateId: number, userId: number) {
    try {
      // Check if user can access this template
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      if (!template.isPublic && template.createdBy !== userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.isAdmin) {
          throw new Error('Not authorized to access template versions');
        }
      }

      const versions = await prisma.templateVersion.findMany({
        where: { templateId },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
            },
          },
        },
        orderBy: { versionNumber: 'desc' },
      });

      return versions;
    } catch (error) {
      logger.error('Get template versions failed:', error);
      throw error;
    }
  }
}

export default new TemplateService();