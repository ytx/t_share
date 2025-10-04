import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import prisma from '../config/database';

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
        include: {
          project: true,
        },
      });

      if (!existingDocument) {
        throw new Error('Document not found');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      // Special access control for shared project documents
      if (existingDocument.title === 'プロジェクト内共有' && existingDocument.project) {
        // Allow access if: project is public OR user is owner OR user is admin
        const project = existingDocument.project;
        if (!project.isPublic && !user?.isAdmin && project.createdBy !== userId) {
          throw new Error('Not authorized to update this document');
        }
      } else if (existingDocument.title === 'メモ（自分用）') {
        // Personal memo: only creator can update
        if (existingDocument.createdBy !== userId) {
          throw new Error('Not authorized to update this document');
        }
      } else {
        // Regular document: only creator or admin can update
        if (!user?.isAdmin && existingDocument.createdBy !== userId) {
          throw new Error('Not authorized to update this document');
        }
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

      logger.info(`Document updated: ${id} (${document.title}) by user ${userId}, content length: ${document.content.length}`);
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

          // Keyword search (includes response field for imported conversations)
          keyword ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { content: { contains: keyword, mode: 'insensitive' } },
              { response: { contains: keyword, mode: 'insensitive' } },
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

      // Check access: allow if project is public OR user is owner OR user is admin
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!project.isPublic && !user?.isAdmin && project.createdBy !== userId) {
        throw new Error('Not authorized to access this project');
      }

      const documents = await prisma.document.findMany({
        where: {
          projectId,
          title: {
            notIn: ['プロジェクト内共有', 'メモ（自分用）'] // Exclude special documents
          }
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

  async getOrCreateSharedProjectDocument(projectId: number, userId: number) {
    try {
      // Verify project exists and user has access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Check access: allow if project is public OR user is owner OR user is admin
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!project.isPublic && !user?.isAdmin && project.createdBy !== userId) {
        throw new Error('Not authorized to access this project');
      }

      // Try to find existing shared document
      let sharedDoc = await prisma.document.findFirst({
        where: {
          projectId,
          title: 'プロジェクト内共有',
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

      // If not found, create it
      if (!sharedDoc) {
        sharedDoc = await prisma.document.create({
          data: {
            projectId,
            title: 'プロジェクト内共有',
            content: '',
            contentMarkdown: '',
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

        logger.info(`Shared project document created for project ${projectId}`);
      }

      return sharedDoc;
    } catch (error) {
      logger.error('Get or create shared project document failed:', error);
      throw error;
    }
  }

  async getOrCreatePersonalMemo(userId: number, projectId?: number) {
    try {
      logger.info(`Getting personal memo for user ${userId}, projectId: ${projectId}`);

      // Try to find existing personal memo for this user and project
      let personalMemo = await prisma.document.findFirst({
        where: {
          createdBy: userId,
          projectId: projectId !== undefined ? projectId : null,
          title: 'メモ（自分用）',
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

      // If not found, create it
      if (!personalMemo) {
        personalMemo = await prisma.document.create({
          data: {
            title: 'メモ（自分用）',
            content: '',
            contentMarkdown: '',
            createdBy: userId,
            projectId: projectId !== undefined ? projectId : null,
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

        logger.info(`Personal memo created for user ${userId}${projectId ? ` in project ${projectId}` : ' (no project)'}`);
      }

      logger.info(`Returning personal memo id: ${personalMemo.id}, projectId: ${personalMemo.projectId}`);
      return personalMemo;
    } catch (error) {
      logger.error('Get or create personal memo failed:', error);
      throw error;
    }
  }
}

export default new DocumentService();