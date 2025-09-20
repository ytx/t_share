import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface SystemStats {
  overview: {
    totalUsers: number;
    totalTemplates: number;
    totalProjects: number;
    totalDocuments: number;
    totalVariables: number;
  };
  userActivity: {
    activeUsersToday: number;
    activeUsersWeek: number;
    activeUsersMonth: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
  };
  templateActivity: {
    templatesCreatedToday: number;
    templatesCreatedWeek: number;
    templatesCreatedMonth: number;
    templateUsageToday: number;
    templateUsageWeek: number;
    templateUsageMonth: number;
    popularTemplates: Array<{
      id: number;
      title: string;
      usageCount: number;
      creator: string;
    }>;
  };
  projectActivity: {
    projectsCreatedToday: number;
    projectsCreatedWeek: number;
    projectsCreatedMonth: number;
    documentsCreatedToday: number;
    documentsCreatedWeek: number;
    documentsCreatedMonth: number;
  };
  systemHealth: {
    databaseConnections: number;
    memoryUsage: string;
    uptime: string;
    errorCount24h: number;
  };
}

class AdminService {
  async getSystemStats(): Promise<SystemStats> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Overview statistics - batch all queries for better performance
      const [
        totalUsers,
        totalTemplates,
        totalProjects,
        totalDocuments,
        totalUserVariables,
        totalProjectVariables,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        templatesCreatedToday,
        templatesCreatedWeek,
        templatesCreatedMonth,
        projectsCreatedToday,
        projectsCreatedWeek,
        projectsCreatedMonth,
        documentsCreatedToday,
        documentsCreatedWeek,
        documentsCreatedMonth,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.template.count(),
        prisma.project.count(),
        prisma.document.count(),
        prisma.userVariable.count(),
        prisma.projectVariable.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.template.count({ where: { createdAt: { gte: today } } }),
        prisma.template.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.template.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.project.count({ where: { createdAt: { gte: today } } }),
        prisma.project.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.project.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.document.count({ where: { createdAt: { gte: today } } }),
        prisma.document.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.document.count({ where: { createdAt: { gte: monthAgo } } }),
      ]);

      // User and template activity statistics already included above

      // Template usage statistics
      const [
        templateUsageToday,
        templateUsageWeek,
        templateUsageMonth,
      ] = await Promise.all([
        prisma.templateUsage.aggregate({
          where: { lastUsedAt: { gte: today } },
          _sum: { usageCount: true },
        }).then(result => result._sum.usageCount || 0),
        prisma.templateUsage.aggregate({
          where: { lastUsedAt: { gte: weekAgo } },
          _sum: { usageCount: true },
        }).then(result => result._sum.usageCount || 0),
        prisma.templateUsage.aggregate({
          where: { lastUsedAt: { gte: monthAgo } },
          _sum: { usageCount: true },
        }).then(result => result._sum.usageCount || 0),
      ]);

      // Popular templates
      const popularTemplatesData = await prisma.templateUsage.findMany({
        orderBy: { usageCount: 'desc' },
        take: 10,
        include: {
          template: {
            include: {
              creator: {
                select: {
                  displayName: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      const popularTemplates = popularTemplatesData.map(usage => ({
        id: usage.template.id,
        title: usage.template.title,
        usageCount: usage.usageCount,
        creator: usage.template.creator.displayName || usage.template.creator.username || 'Unknown',
      }));

      // Project activity statistics already included above

      // System health (basic metrics)
      const systemHealth = {
        databaseConnections: 1, // Simplified for this implementation
        memoryUsage: process.memoryUsage().heapUsed ?
          `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB` : 'N/A',
        uptime: process.uptime ? `${Math.round(process.uptime() / 3600)}h` : 'N/A',
        errorCount24h: 0, // Would need error tracking system
      };

      return {
        overview: {
          totalUsers,
          totalTemplates,
          totalProjects,
          totalDocuments,
          totalVariables: totalUserVariables + totalProjectVariables,
        },
        userActivity: {
          activeUsersToday: 0, // Would need session tracking
          activeUsersWeek: 0,
          activeUsersMonth: 0,
          newUsersToday,
          newUsersWeek,
          newUsersMonth,
        },
        templateActivity: {
          templatesCreatedToday,
          templatesCreatedWeek,
          templatesCreatedMonth,
          templateUsageToday,
          templateUsageWeek,
          templateUsageMonth,
          popularTemplates,
        },
        projectActivity: {
          projectsCreatedToday,
          projectsCreatedWeek,
          projectsCreatedMonth,
          documentsCreatedToday,
          documentsCreatedWeek,
          documentsCreatedMonth,
        },
        systemHealth,
      };
    } catch (error) {
      logger.error('Get system stats failed:', error);
      throw error;
    }
  }

  async getUserList(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                createdTemplates: true,
                createdProjects: true,
                documents: true,
                userVariables: true,
              },
            },
          },
        }),
        prisma.user.count(),
      ]);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get user list failed:', error);
      throw error;
    }
  }

  async getRecentActivity(limit = 50) {
    try {
      // Batch all activity queries for better performance
      const itemsPerType = Math.floor(limit / 3);

      const [recentTemplates, recentProjects, recentDocuments] = await Promise.all([
        prisma.template.findMany({
          take: itemsPerType,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                displayName: true,
                username: true,
              },
            },
          },
        }),
        prisma.project.findMany({
          take: itemsPerType,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                displayName: true,
                username: true,
              },
            },
          },
        }),
        prisma.document.findMany({
          take: itemsPerType,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                displayName: true,
                username: true,
              },
            },
            project: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]);

      // Combine and sort by creation date
      const activities = [
        ...recentTemplates.map(item => ({
          type: 'template' as const,
          id: item.id,
          title: item.title,
          creator: item.creator.displayName || item.creator.username || 'Unknown',
          createdAt: item.createdAt,
        })),
        ...recentProjects.map(item => ({
          type: 'project' as const,
          id: item.id,
          title: item.name,
          creator: item.creator.displayName || item.creator.username || 'Unknown',
          createdAt: item.createdAt,
        })),
        ...recentDocuments.map(item => ({
          type: 'document' as const,
          id: item.id,
          title: item.title || `Document ${item.id}`,
          creator: item.creator.displayName || item.creator.username || 'Unknown',
          project: item.project?.name,
          createdAt: item.createdAt,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
       .slice(0, limit);

      return activities;
    } catch (error) {
      logger.error('Get recent activity failed:', error);
      throw error;
    }
  }

  async getSystemHealthDetails() {
    try {
      // Database connection test
      const dbCheck = await prisma.$queryRaw`SELECT 1 as test`;

      // Memory usage
      const memoryUsage = process.memoryUsage();

      // System uptime
      const uptime = process.uptime();

      return {
        database: {
          status: dbCheck ? 'connected' : 'disconnected',
          responseTime: Date.now(), // Simplified
        },
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        system: {
          uptime: Math.round(uptime),
          platform: process.platform,
          nodeVersion: process.version,
        },
      };
    } catch (error) {
      logger.error('Get system health details failed:', error);
      throw error;
    }
  }

  async createUser(data: {
    email: string;
    displayName?: string;
    username?: string;
    isAdmin?: boolean;
    password: string;
  }) {
    try {
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          displayName: data.displayName,
          username: data.username,
          isAdmin: data.isAdmin || false,
          passwordHash,
        },
        include: {
          _count: {
            select: {
              createdTemplates: true,
              createdProjects: true,
              documents: true,
              userVariables: true,
            },
          },
        },
      });

      logger.info(`User created: ${user.id} by admin`);
      return user;
    } catch (error) {
      logger.error('Create user failed:', error);
      throw error;
    }
  }

  async updateUser(id: number, data: {
    email?: string;
    displayName?: string;
    username?: string;
    isAdmin?: boolean;
  }) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        include: {
          _count: {
            select: {
              createdTemplates: true,
              createdProjects: true,
              documents: true,
              userVariables: true,
            },
          },
        },
      });

      logger.info(`User updated: ${id} by admin`);
      return user;
    } catch (error) {
      logger.error('Update user failed:', error);
      throw error;
    }
  }

  async deleteUser(id: number) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new Error('User not found');
      }

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id },
      });

      logger.info(`User deleted: ${id} by admin`);
      return { success: true };
    } catch (error) {
      logger.error('Delete user failed:', error);
      throw error;
    }
  }

  // ユーザー承認システム機能
  async approveUser(userId: number, adminId: number) {
    try {
      // ユーザーが存在し、申請中であることを確認
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.approvalStatus === 'approved') {
        throw new Error('User is already approved');
      }

      // ユーザーを承認
      const approvedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedBy: adminId,
        },
        include: {
          approver: {
            select: {
              id: true,
              displayName: true,
              email: true,
            }
          }
        }
      });

      logger.info(`User approved: ${userId} by admin ${adminId}`);
      return approvedUser;
    } catch (error) {
      logger.error('Approve user failed:', error);
      throw error;
    }
  }

  async getPendingUsers() {
    try {
      const pendingUsers = await prisma.user.findMany({
        where: {
          approvalStatus: 'pending'
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          googleId: true,
          appliedAt: true,
          createdAt: true,
        },
        orderBy: {
          appliedAt: 'asc'
        }
      });

      return pendingUsers;
    } catch (error) {
      logger.error('Get pending users failed:', error);
      throw error;
    }
  }

  async getUserApprovalStats() {
    try {
      const stats = await prisma.user.groupBy({
        by: ['approvalStatus'],
        _count: {
          approvalStatus: true
        }
      });

      const pendingCount = stats.find(s => s.approvalStatus === 'pending')?._count.approvalStatus || 0;
      const approvedCount = stats.find(s => s.approvalStatus === 'approved')?._count.approvalStatus || 0;

      // 7日以内の申請数
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentApplications = await prisma.user.count({
        where: {
          appliedAt: {
            gte: sevenDaysAgo
          }
        }
      });

      return {
        pendingCount,
        approvedCount,
        recentApplications,
      };
    } catch (error) {
      logger.error('Get user approval stats failed:', error);
      throw error;
    }
  }
}

export default new AdminService();