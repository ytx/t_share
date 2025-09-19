import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface DocumentCreateData {
  projectId?: number;
  title?: string;
  content: string;
  contentMarkdown: string;
}

export interface DocumentUpdateData {
  projectId?: number;
  title?: string;
  content?: string;
  contentMarkdown?: string;
}

export interface DocumentSearchOptions {
  projectId?: number;
  keyword?: string;
  page?: number;
  limit?: number;
}

class DocumentService {
  async createDocument(userId: number, data: DocumentCreateData) {
    try {
      // If projectId is provided, verify it exists and user has access
      if (data.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
        });

        if (!project) {
          throw new Error('Project not found');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.isAdmin && project.createdBy !== userId) {
          throw new Error('Not authorized to add documents to this project');
        }
      }

      const document = await prisma.document.create({
        data: {
          projectId: data.projectId,
          title: data.title,
          content: data.content,
          contentMarkdown: data.contentMarkdown,
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

      logger.info(`Document created: ${document.id} by user ${userId}`);
      return document;
    } catch (error) {
      logger.error('Create document failed:', error);
      throw error;
    }
  }

  async updateDocument(id: number, userId: number, data: DocumentUpdateData) {
    try {
      // Check if document exists and user is the creator
      const existingDocument = await prisma.document.findUnique({
        where: { id },
      });

      if (!existingDocument) {
        throw new Error('Document not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && existingDocument.createdBy !== userId) {
        throw new Error('Not authorized to update this document');
      }

      // If changing projectId, verify the new project exists and user has access
      if (data.projectId && data.projectId !== existingDocument.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
        });

        if (!project) {
          throw new Error('Project not found');
        }

        if (!user?.isAdmin && project.createdBy !== userId) {
          throw new Error('Not authorized to move document to this project');
        }
      }

      const document = await prisma.document.update({
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

      logger.info(`Document updated: ${id} by user ${userId}`);
      return document;
    } catch (error) {
      logger.error('Update document failed:', error);
      throw error;
    }
  }

  async deleteDocument(id: number, userId: number) {
    try {
      // Check if document exists and user is the creator
      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && document.createdBy !== userId) {
        throw new Error('Not authorized to delete this document');
      }

      await prisma.document.delete({
        where: { id },
      });

      logger.info(`Document deleted: ${id} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Delete document failed:', error);
      throw error;
    }
  }

  async getDocument(id: number, userId?: number) {
    try {
      const document = await prisma.document.findUnique({
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
              description: true,
            },
          },
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Check access permissions
      if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.isAdmin && document.createdBy !== userId) {
          // In the future, this could check project membership
          throw new Error('Not authorized to access this document');
        }
      }

      return document;
    } catch (error) {
      logger.error('Get document failed:', error);
      throw error;
    }
  }

  async searchDocuments(userId: number, options: DocumentSearchOptions) {
    try {
      const {
        projectId,
        keyword,
        page = 1,
        limit = 20,
      } = options;

      // Build where clause
      const where: Prisma.DocumentWhereInput = {
        AND: [
          // User's documents only (in the future, this could include shared documents)
          { createdBy: userId },

          // Project filter
          projectId ? { projectId } : {},

          // Keyword search
          keyword ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { content: { contains: keyword, mode: 'insensitive' } },
            ],
          } : {},
        ],
      };

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
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
          orderBy: {
            updatedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.document.count({ where }),
      ]);

      return {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Search documents failed:', error);
      throw error;
    }
  }

  async getProjectDocuments(projectId: number, userId: number) {
    try {
      // Verify project exists and user has access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isAdmin && project.createdBy !== userId) {
        throw new Error('Not authorized to access this project');
      }

      const documents = await prisma.document.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      return documents;
    } catch (error) {
      logger.error('Get project documents failed:', error);
      throw error;
    }
  }
}

export default new DocumentService();