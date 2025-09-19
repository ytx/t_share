import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface ExportData {
  exportedAt: string;
  version: string;
  data: {
    users: any[];
    scenes: any[];
    tags: any[];
    projects: any[];
    templates: any[];
    templateVersions: any[];
    templateTags: any[];
    templateUsage: any[];
    userVariables: any[];
    projectVariables: any[];
    documents: any[];
    userPreferences: any[];
  };
}

export interface ImportOptions {
  clearExistingData?: boolean;
  preserveIds?: boolean;
}

export class DataExportImportService {
  /**
   * システム全体のデータをエクスポート
   */
  async exportAllData(): Promise<ExportData> {
    try {
      logger.info('Starting data export...');

      // すべてのテーブルからデータを取得（リレーションを含む）
      const [
        users,
        scenes,
        tags,
        projects,
        templates,
        templateVersions,
        templateTags,
        templateUsage,
        userVariables,
        projectVariables,
        documents,
        userPreferences,
      ] = await Promise.all([
        prisma.user.findMany({
          include: {
            createdTemplates: false,
            createdScenes: false,
            createdTags: false,
            createdProjects: false,
            templateUsage: false,
            userVariables: false,
            projectVariables: false,
            documents: false,
            preferences: false,
            templateVersions: false,
          },
        }),
        prisma.scene.findMany({
          include: {
            creator: false,
            templates: false,
          },
        }),
        prisma.tag.findMany({
          include: {
            creator: false,
            templateTags: false,
          },
        }),
        prisma.project.findMany({
          include: {
            creator: false,
            projectVariables: false,
            documents: false,
          },
        }),
        prisma.template.findMany({
          include: {
            creator: false,
            scene: false,
            templateTags: false,
            templateVersions: false,
            templateUsage: false,
          },
        }),
        prisma.templateVersion.findMany({
          include: {
            template: false,
            creator: false,
          },
        }),
        prisma.templateTag.findMany({
          include: {
            template: false,
            tag: false,
          },
        }),
        prisma.templateUsage.findMany({
          include: {
            template: false,
            user: false,
          },
        }),
        prisma.userVariable.findMany({
          include: {
            user: false,
          },
        }),
        prisma.projectVariable.findMany({
          include: {
            project: false,
            creator: false,
          },
        }),
        prisma.document.findMany({
          include: {
            project: false,
            creator: false,
          },
        }),
        prisma.userPreference.findMany({
          include: {
            user: false,
          },
        }),
      ]);

      const exportData: ExportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        data: {
          users,
          scenes,
          tags,
          projects,
          templates,
          templateVersions,
          templateTags,
          templateUsage,
          userVariables,
          projectVariables,
          documents,
          userPreferences,
        },
      };

      logger.info(`Data export completed. Users: ${users.length}, Templates: ${templates.length}, Projects: ${projects.length}`);
      return exportData;
    } catch (error) {
      logger.error('Data export failed:', error);
      throw new Error('データのエクスポートに失敗しました');
    }
  }

  /**
   * エクスポートされたデータをインポート
   */
  async importAllData(exportData: ExportData, options: ImportOptions = {}): Promise<void> {
    const { clearExistingData = false, preserveIds = true } = options;

    try {
      logger.info('Starting data import...', { clearExistingData, preserveIds });

      // バリデーション
      this.validateImportData(exportData);

      // トランザクション内で実行
      await prisma.$transaction(async (prisma) => {
        if (clearExistingData) {
          await this.clearAllData(prisma);
        }

        // IDを保持する場合は、外部キー制約を一時的に無効化
        if (preserveIds) {
          await prisma.$executeRaw`SET session_replication_role = replica;`;
        }

        try {
          // データを依存関係の順序でインポート
          await this.importInOrder(prisma, exportData.data, preserveIds);
        } finally {
          // 外部キー制約を再有効化
          if (preserveIds) {
            await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
          }
        }
      });

      logger.info('Data import completed successfully');
    } catch (error) {
      logger.error('Data import failed:', error);
      throw new Error('データのインポートに失敗しました');
    }
  }

  /**
   * インポートデータのバリデーション
   */
  private validateImportData(exportData: ExportData): void {
    if (!exportData.data) {
      throw new Error('Invalid export data: missing data object');
    }

    const requiredTables = [
      'users', 'scenes', 'tags', 'projects', 'templates',
      'templateVersions', 'templateTags', 'templateUsage',
      'userVariables', 'projectVariables', 'documents', 'userPreferences'
    ];

    for (const table of requiredTables) {
      if (!Array.isArray(exportData.data[table as keyof typeof exportData.data])) {
        throw new Error(`Invalid export data: ${table} must be an array`);
      }
    }
  }

  /**
   * 既存データの削除
   */
  private async clearAllData(prisma: any): Promise<void> {
    logger.info('Clearing existing data...');

    // 依存関係の逆順で削除
    await prisma.templateUsage.deleteMany();
    await prisma.templateTag.deleteMany();
    await prisma.templateVersion.deleteMany();
    await prisma.template.deleteMany();
    await prisma.projectVariable.deleteMany();
    await prisma.document.deleteMany();
    await prisma.project.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.scene.deleteMany();
    await prisma.userVariable.deleteMany();
    await prisma.userPreference.deleteMany();
    await prisma.user.deleteMany();

    logger.info('Existing data cleared');
  }

  /**
   * 依存関係の順序でデータをインポート
   */
  private async importInOrder(prisma: any, data: ExportData['data'], preserveIds: boolean): Promise<void> {
    const stats = {
      users: 0,
      scenes: 0,
      tags: 0,
      projects: 0,
      templates: 0,
      templateVersions: 0,
      templateTags: 0,
      templateUsage: 0,
      userVariables: 0,
      projectVariables: 0,
      documents: 0,
      userPreferences: 0,
    };

    // 1. Users (他のすべてのテーブルが参照)
    if (data.users.length > 0) {
      for (const user of data.users) {
        const userData = preserveIds
          ? user
          : { ...user, id: undefined };
        await prisma.user.create({ data: userData });
        stats.users++;
      }
    }

    // 2. Scenes (Templates が参照)
    if (data.scenes.length > 0) {
      for (const scene of data.scenes) {
        const sceneData = preserveIds
          ? scene
          : { ...scene, id: undefined };
        await prisma.scene.create({ data: sceneData });
        stats.scenes++;
      }
    }

    // 3. Tags (TemplateTags が参照)
    if (data.tags.length > 0) {
      for (const tag of data.tags) {
        const tagData = preserveIds
          ? tag
          : { ...tag, id: undefined };
        await prisma.tag.create({ data: tagData });
        stats.tags++;
      }
    }

    // 4. Projects (Documents, ProjectVariables が参照)
    if (data.projects.length > 0) {
      for (const project of data.projects) {
        const projectData = preserveIds
          ? project
          : { ...project, id: undefined };
        await prisma.project.create({ data: projectData });
        stats.projects++;
      }
    }

    // 5. Templates (TemplateVersions, TemplateTags, TemplateUsage が参照)
    if (data.templates.length > 0) {
      for (const template of data.templates) {
        const templateData = preserveIds
          ? template
          : { ...template, id: undefined };
        await prisma.template.create({ data: templateData });
        stats.templates++;
      }
    }

    // 6. Template Versions
    if (data.templateVersions.length > 0) {
      for (const version of data.templateVersions) {
        const versionData = preserveIds
          ? version
          : { ...version, id: undefined };
        await prisma.templateVersion.create({ data: versionData });
        stats.templateVersions++;
      }
    }

    // 7. Template Tags (中間テーブル)
    if (data.templateTags.length > 0) {
      for (const templateTag of data.templateTags) {
        const templateTagData = preserveIds
          ? templateTag
          : { ...templateTag, id: undefined };
        await prisma.templateTag.create({ data: templateTagData });
        stats.templateTags++;
      }
    }

    // 8. Template Usage
    if (data.templateUsage.length > 0) {
      for (const usage of data.templateUsage) {
        const usageData = preserveIds
          ? usage
          : { ...usage, id: undefined };
        await prisma.templateUsage.create({ data: usageData });
        stats.templateUsage++;
      }
    }

    // 9. User Variables
    if (data.userVariables.length > 0) {
      for (const userVar of data.userVariables) {
        const userVarData = preserveIds
          ? userVar
          : { ...userVar, id: undefined };
        await prisma.userVariable.create({ data: userVarData });
        stats.userVariables++;
      }
    }

    // 10. Project Variables
    if (data.projectVariables.length > 0) {
      for (const projectVar of data.projectVariables) {
        const projectVarData = preserveIds
          ? projectVar
          : { ...projectVar, id: undefined };
        await prisma.projectVariable.create({ data: projectVarData });
        stats.projectVariables++;
      }
    }

    // 11. Documents
    if (data.documents.length > 0) {
      for (const document of data.documents) {
        const documentData = preserveIds
          ? document
          : { ...document, id: undefined };
        await prisma.document.create({ data: documentData });
        stats.documents++;
      }
    }

    // 12. User Preferences
    if (data.userPreferences.length > 0) {
      for (const preference of data.userPreferences) {
        const preferenceData = preserveIds
          ? preference
          : { ...preference, id: undefined };
        await prisma.userPreference.create({ data: preferenceData });
        stats.userPreferences++;
      }
    }

    logger.info('Data import statistics:', stats);
  }

  /**
   * エクスポートデータの統計情報を取得
   */
  async getExportStats(): Promise<any> {
    try {
      const [
        userCount,
        sceneCount,
        tagCount,
        projectCount,
        templateCount,
        documentCount,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.scene.count(),
        prisma.tag.count(),
        prisma.project.count(),
        prisma.template.count(),
        prisma.document.count(),
      ]);

      return {
        users: userCount,
        scenes: sceneCount,
        tags: tagCount,
        projects: projectCount,
        templates: templateCount,
        documents: documentCount,
      };
    } catch (error) {
      logger.error('Failed to get export stats:', error);
      throw new Error('統計情報の取得に失敗しました');
    }
  }
}