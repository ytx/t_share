import { Request, Response } from 'express';
import { z } from 'zod';
import { DataExportImportService } from '../services/dataExportImportService';
import logger from '../utils/logger';

const dataExportImportService = new DataExportImportService();

// インポートオプションのバリデーションスキーマ
const importCategoriesSchema = z.object({
  users: z.boolean(),
  scenesAndTemplates: z.boolean(),
  projectsAndDocuments: z.boolean(),
  systemSettings: z.boolean(),
});

const importOptionsSchema = z.object({
  clearExistingData: z.boolean().optional().default(false),
  preserveIds: z.boolean().optional().default(true),
  categories: importCategoriesSchema.optional(),
});

/**
 * システム全体のデータをエクスポート
 */
export const exportAllData = async (req: Request, res: Response) => {
  try {
    logger.info('Data export requested by admin user:', req.user?.id);

    const exportData = await dataExportImportService.exportAllData();

    // Generate JST timestamp for filename
    const now = new Date();
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
    const timestamp = jstTime.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `t-share-export-${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Pretty format JSON
    res.send(JSON.stringify(exportData, null, 2));

    logger.info('Data export completed successfully', {
      filename,
      dataSize: JSON.stringify(exportData).length
    });
  } catch (error) {
    logger.error('Data export failed:', error);
    res.status(500).json({
      error: 'データのエクスポートに失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * エクスポートされたデータをインポート
 */
export const importAllData = async (req: Request, res: Response) => {
  try {
    logger.info('Data import requested by admin user:', req.user?.id);

    // リクエストボディのバリデーション
    if (!req.body || !req.body.data) {
      return res.status(400).json({
        error: 'Invalid import data: missing data object'
      });
    }

    // インポートオプションのバリデーション
    const optionsValidation = importOptionsSchema.safeParse(req.body.options || {});
    if (!optionsValidation.success) {
      return res.status(400).json({
        error: 'Invalid import options',
        details: optionsValidation.error.issues
      });
    }

    const options = optionsValidation.data;
    const exportData = req.body;

    // データ形式の基本チェック
    if (!exportData.exportedAt || !exportData.version) {
      return res.status(400).json({
        error: 'Invalid export data format: missing metadata'
      });
    }

    logger.info('Starting data import with options:', options);

    await dataExportImportService.importAllData(exportData, options);

    logger.info('Data import completed successfully');
    res.json({
      message: 'データのインポートが完了しました',
      options,
      importedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Data import failed:', error);
    res.status(500).json({
      error: 'データのインポートに失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * エクスポート用の統計情報を取得
 */
export const getExportStats = async (req: Request, res: Response) => {
  try {
    logger.info('Export stats requested by admin user:', req.user?.id);

    const stats = await dataExportImportService.getExportStats();

    res.json({
      message: 'エクスポート統計情報を取得しました',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get export stats:', error);
    res.status(500).json({
      error: '統計情報の取得に失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * インポートデータの事前検証
 */
export const validateImportData = async (req: Request, res: Response) => {
  try {
    logger.info('Import data validation requested by admin user:', req.user?.id);

    if (!req.body || !req.body.data) {
      return res.status(400).json({
        error: 'Invalid import data: missing data object',
        valid: false
      });
    }

    const exportData = req.body;

    // 基本的なデータ形式チェック
    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      stats: {} as any
    };

    // メタデータチェック
    if (!exportData.exportedAt) {
      validation.errors.push('Missing exportedAt field');
    }
    if (!exportData.version) {
      validation.errors.push('Missing version field');
    }

    // データテーブルチェック
    const requiredTables = [
      'users', 'scenes', 'tags', 'projects', 'templates',
      'templateVersions', 'templateTags', 'templateUsage',
      'userVariables', 'projectVariables', 'documents', 'userPreferences'
    ];

    for (const table of requiredTables) {
      const tableData = exportData.data?.[table];
      if (!Array.isArray(tableData)) {
        validation.errors.push(`Invalid or missing ${table} data`);
      } else {
        validation.stats[table] = tableData.length;
      }
    }

    // バージョン互換性チェック
    if (exportData.version && exportData.version !== '1.0.0') {
      validation.warnings.push(`Export version ${exportData.version} may not be fully compatible`);
    }

    validation.valid = validation.errors.length === 0;

    logger.info('Import data validation completed', {
      valid: validation.valid,
      errors: validation.errors.length,
      warnings: validation.warnings.length
    });

    res.json({
      message: 'インポートデータの検証が完了しました',
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Import data validation failed:', error);
    res.status(500).json({
      error: 'インポートデータの検証に失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error',
      valid: false
    });
  }
};