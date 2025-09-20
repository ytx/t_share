import { Request, Response } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';

interface OAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  autoApprove: boolean;
}

const oauthConfigSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string().min(1, 'クライアントIDは必須です'),
  clientSecret: z.string().min(1, 'クライアントシークレットは必須です'),
  redirectUri: z.string().url('有効なURLを入力してください'),
  scopes: z.array(z.string()).min(1, '少なくとも1つのスコープが必要です'),
  autoApprove: z.boolean(),
});

let currentConfig: OAuthConfig = {
  enabled: false,
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  scopes: ['openid', 'profile', 'email'],
  autoApprove: false,
};

/**
 * OAuth設定を取得
 */
export const getOAuthConfig = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    logger.info('OAuth config requested by admin user:', userId);

    // セキュリティのため、クライアントシークレットはマスクして返す
    const safeConfig = {
      ...currentConfig,
      clientSecret: currentConfig.clientSecret ? '••••••••••••••••' : '',
    };

    res.json({
      message: 'OAuth設定を取得しました',
      config: safeConfig,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get OAuth config:', error);
    res.status(500).json({
      error: 'OAuth設定の取得に失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * OAuth設定を更新
 */
export const updateOAuthConfig = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    logger.info('OAuth config update requested by admin user:', userId);

    // バリデーション
    const validation = oauthConfigSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid OAuth configuration',
        details: validation.error.errors,
      });
    }

    const newConfig = validation.data;

    // 設定を更新
    currentConfig = {
      ...newConfig,
      // 環境変数も更新（実際の運用では設定ファイルやデータベースに保存）
    };

    // 環境変数を更新
    if (newConfig.enabled) {
      process.env.GOOGLE_CLIENT_ID = newConfig.clientId;
      process.env.GOOGLE_CLIENT_SECRET = newConfig.clientSecret;
      process.env.GOOGLE_REDIRECT_URI = newConfig.redirectUri;
    }

    logger.info('OAuth config updated successfully', {
      enabled: newConfig.enabled,
      autoApprove: newConfig.autoApprove,
      scopes: newConfig.scopes,
    });

    res.json({
      message: 'OAuth設定が正常に更新されました',
      config: {
        ...newConfig,
        clientSecret: '••••••••••••••••', // セキュリティのためマスク
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to update OAuth config:', error);
    res.status(500).json({
      error: 'OAuth設定の更新に失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * OAuth設定をテスト
 */
export const testOAuthConfig = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    logger.info('OAuth config test requested by admin user:', userId);

    // バリデーション
    const validation = oauthConfigSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid OAuth configuration',
        details: validation.error.errors,
      });
    }

    const config = validation.data;

    // 基本的な設定チェック
    const testResults = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      tests: {
        clientIdFormat: false,
        redirectUriReachable: false,
        scopesValid: false,
      },
    };

    // クライアントIDの形式チェック
    if (config.clientId.includes('.googleusercontent.com')) {
      testResults.tests.clientIdFormat = true;
    } else {
      testResults.errors.push('クライアントIDの形式が正しくありません');
      testResults.valid = false;
    }

    // リダイレクトURIの形式チェック
    try {
      new URL(config.redirectUri);
      testResults.tests.redirectUriReachable = true;
    } catch {
      testResults.errors.push('リダイレクトURIの形式が正しくありません');
      testResults.valid = false;
    }

    // スコープの検証
    const validScopes = [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const invalidScopes = config.scopes.filter(scope => !validScopes.includes(scope));
    if (invalidScopes.length === 0) {
      testResults.tests.scopesValid = true;
    } else {
      testResults.warnings.push(`不明なスコープが含まれています: ${invalidScopes.join(', ')}`);
    }

    // HTTPSチェック
    if (!config.redirectUri.startsWith('https://') && !config.redirectUri.startsWith('http://localhost')) {
      testResults.warnings.push('本番環境ではHTTPSの使用を推奨します');
    }

    logger.info('OAuth config test completed', {
      valid: testResults.valid,
      errors: testResults.errors.length,
      warnings: testResults.warnings.length,
    });

    res.json({
      message: 'OAuth設定のテストが完了しました',
      results: testResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('OAuth config test failed:', error);
    res.status(500).json({
      error: 'OAuth設定のテストに失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * 現在のOAuth設定を取得（内部用）
 */
export const getCurrentOAuthConfig = (): OAuthConfig => {
  return currentConfig;
};