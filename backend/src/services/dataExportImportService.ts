import logger from '../utils/logger';
import prisma from '../config/database';
import {
  User, Scene, Tag, Project, Template, TemplateVersion,
  TemplateTag, TemplateUsage, UserVariable, ProjectVariable,
  Document, UserPreference
} from '@prisma/client';

export interface ExportData {
  exportedAt: string;
  version: string;
  data: {
    users: User[];
    scenes: Scene[];
    tags: Tag[];
    projects: Project[];
    templates: Template[];
    templateVersions: TemplateVersion[];
    templateTags: TemplateTag[];
    templateUsage: TemplateUsage[];
    userVariables: UserVariable[];
    projectVariables: ProjectVariable[];
    documents: Document[];
    userPreferences: UserPreference[];
  };
}

export interface ImportOptions {
  clearExistingData?: boolean;
  preserveIds?: boolean;
  categories?: ImportCategories;
}

export interface ImportCategories {
  users: boolean;
  scenesAndTemplates: boolean;
  projectsAndDocuments: boolean;
  systemSettings: boolean;
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
    const { clearExistingData = false, preserveIds = true, categories } = options;

    try {
      logger.info('Starting data import...', { clearExistingData, preserveIds, categories });

      // バリデーション
      this.validateImportData(exportData);

      // トランザクション内で実行
      await prisma.$transaction(async (prisma) => {
        if (clearExistingData) {
          if (categories) {
            // カテゴリ別削除
            await this.clearCategoryData(prisma, categories);
          } else {
            // 全データ削除
            await this.clearAllData(prisma);
          }
        }

        // IDを保持する場合は、外部キー制約を一時的に無効化
        if (preserveIds) {
          await prisma.$executeRaw`SET session_replication_role = replica;`;
        }

        try {
          // データを依存関係の順序でインポート
          await this.importInOrder(prisma, exportData.data, preserveIds, categories);
        } finally {
          // 外部キー制約を再有効化
          if (preserveIds) {
            await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
          }
        }

        // インポート後にシーケンスをリセット
        if (preserveIds) {
          await this.resetSequences(prisma);
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
   * 既存データの削除（カテゴリ別対応）
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
   * カテゴリ別データの削除
   */
  private async clearCategoryData(prisma: any, categories: ImportCategories): Promise<void> {
    logger.info('Clearing category data...', categories);

    // シーン・定型文関連データ
    if (categories.scenesAndTemplates) {
      await prisma.templateUsage.deleteMany();
      await prisma.templateTag.deleteMany();
      await prisma.templateVersion.deleteMany();
      await prisma.template.deleteMany();
      await prisma.tag.deleteMany();
      await prisma.scene.deleteMany();
      logger.info('Cleared scenes and templates data');
    }

    // プロジェクト・文書関連データ
    if (categories.projectsAndDocuments) {
      await prisma.projectVariable.deleteMany();
      await prisma.document.deleteMany();
      await prisma.project.deleteMany();
      logger.info('Cleared projects and documents data');
    }

    // システム設定（ユーザー設定）
    if (categories.systemSettings) {
      await prisma.userVariable.deleteMany();
      await prisma.userPreference.deleteMany();
      logger.info('Cleared system settings data');
    }

    // ユーザー（最後に削除）
    if (categories.users) {
      await prisma.user.deleteMany();
      logger.info('Cleared users data');
    }
  }

  /**
   * 依存関係の順序でデータをインポート
   */
  private async importInOrder(prisma: any, data: ExportData['data'], preserveIds: boolean, categories?: ImportCategories): Promise<void> {
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
    if (data.users.length > 0 && (!categories || categories.users)) {
      for (const user of data.users) {
        const userData = preserveIds
          ? user
          : { ...user, id: undefined };
        await prisma.user.create({ data: userData });
        stats.users++;
      }
    }

    // 2. Scenes (Templates が参照)
    if (data.scenes.length > 0 && (!categories || categories.scenesAndTemplates)) {
      for (const scene of data.scenes) {
        const sceneData = preserveIds
          ? scene
          : { ...scene, id: undefined };
        await prisma.scene.create({ data: sceneData });
        stats.scenes++;
      }
    }

    // 3. Tags (TemplateTags が参照)
    if (data.tags.length > 0 && (!categories || categories.scenesAndTemplates)) {
      for (const tag of data.tags) {
        const tagData = preserveIds
          ? tag
          : { ...tag, id: undefined };
        await prisma.tag.create({ data: tagData });
        stats.tags++;
      }
    }

    // 4. Projects (Documents, ProjectVariables が参照)
    if (data.projects.length > 0 && (!categories || categories.projectsAndDocuments)) {
      for (const project of data.projects) {
        const projectData = preserveIds
          ? project
          : { ...project, id: undefined };
        await prisma.project.create({ data: projectData });
        stats.projects++;
      }
    }

    // 5. Templates (TemplateVersions, TemplateTags, TemplateUsage が参照)
    if (data.templates.length > 0 && (!categories || categories.scenesAndTemplates)) {
      for (const template of data.templates) {
        const templateData = preserveIds
          ? template
          : { ...template, id: undefined };
        await prisma.template.create({ data: templateData });
        stats.templates++;
      }
    }

    // 6. Template Versions
    if (data.templateVersions.length > 0 && (!categories || categories.scenesAndTemplates)) {
      for (const version of data.templateVersions) {
        const versionData = preserveIds
          ? version
          : { ...version, id: undefined };
        await prisma.templateVersion.create({ data: versionData });
        stats.templateVersions++;
      }
    }

    // 7. Template Tags (中間テーブル)
    if (data.templateTags.length > 0 && (!categories || categories.scenesAndTemplates)) {
      for (const templateTag of data.templateTags) {
        const templateTagData = preserveIds
          ? templateTag
          : { ...templateTag, id: undefined };
        await prisma.templateTag.create({ data: templateTagData });
        stats.templateTags++;
      }
    }

    // 8. Template Usage
    if (data.templateUsage.length > 0 && (!categories || categories.scenesAndTemplates)) {
      for (const usage of data.templateUsage) {
        const usageData = preserveIds
          ? usage
          : { ...usage, id: undefined };
        await prisma.templateUsage.create({ data: usageData });
        stats.templateUsage++;
      }
    }

    // 9. User Variables
    if (data.userVariables.length > 0 && (!categories || categories.systemSettings)) {
      for (const userVar of data.userVariables) {
        const userVarData = preserveIds
          ? userVar
          : { ...userVar, id: undefined };
        await prisma.userVariable.create({ data: userVarData });
        stats.userVariables++;
      }
    }

    // 10. Project Variables
    if (data.projectVariables.length > 0 && (!categories || categories.projectsAndDocuments)) {
      for (const projectVar of data.projectVariables) {
        const projectVarData = preserveIds
          ? projectVar
          : { ...projectVar, id: undefined };
        await prisma.projectVariable.create({ data: projectVarData });
        stats.projectVariables++;
      }
    }

    // 11. Documents
    if (data.documents.length > 0 && (!categories || categories.projectsAndDocuments)) {
      for (const document of data.documents) {
        const documentData = preserveIds
          ? document
          : { ...document, id: undefined };
        await prisma.document.create({ data: documentData });
        stats.documents++;
      }
    }

    // 12. User Preferences
    if (data.userPreferences.length > 0 && (!categories || categories.systemSettings)) {
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
  async getExportStats(): Promise<{
    users: number;
    scenes: number;
    tags: number;
    projects: number;
    templates: number;
    documents: number;
  }> {
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

  /**
   * データインポート後にシーケンスをリセット
   */
  private async resetSequences(prisma: any): Promise<void> {
    try {
      logger.info('Resetting database sequences...');

      // auto-incrementのIDを持つテーブルとそのシーケンス名
      const tableSequences = [
        { table: 'users', sequence: 'users_id_seq' },
        { table: 'scenes', sequence: 'scenes_id_seq' },
        { table: 'tags', sequence: 'tags_id_seq' },
        { table: 'projects', sequence: 'projects_id_seq' },
        { table: 'templates', sequence: 'templates_id_seq' },
        { table: 'template_versions', sequence: 'template_versions_id_seq' },
        { table: 'template_tags', sequence: 'template_tags_id_seq' },
        { table: 'template_usage', sequence: 'template_usage_id_seq' },
        { table: 'user_variables', sequence: 'user_variables_id_seq' },
        { table: 'project_variables', sequence: 'project_variables_id_seq' },
        { table: 'documents', sequence: 'documents_id_seq' },
        { table: 'user_preferences', sequence: 'user_preferences_id_seq' },
      ];

      for (const { table, sequence } of tableSequences) {
        try {
          // 各テーブルの最大IDを取得（文字列テンプレートで安全に実行）
          const query = `SELECT COALESCE(MAX(id), 0) as max_id FROM ${table}`;
          const result = await prisma.$queryRawUnsafe(query) as any[];
          const maxId = Number(result[0]?.max_id) || 0;

          if (maxId > 0) {
            // シーケンスを最大ID + 1に設定
            const nextId = maxId + 1;
            const setvalQuery = `SELECT setval('${sequence}', ${nextId})`;
            await prisma.$executeRawUnsafe(setvalQuery);
            logger.info(`Reset sequence ${sequence} to ${nextId} (table ${table}, max_id: ${maxId})`);
          } else {
            logger.info(`Skipping sequence ${sequence} for empty table ${table}`);
          }
        } catch (error) {
          logger.error(`Failed to reset sequence ${sequence} for table ${table}:`, error);
          // 個別のテーブルの失敗は継続
        }
      }

      logger.info('Database sequences reset completed');
    } catch (error) {
      logger.error('Failed to reset sequences:', error);
      // シーケンスリセットは失敗しても全体のインポートは継続する
      logger.warn('Continuing with import despite sequence reset failure');
    }
  }
}