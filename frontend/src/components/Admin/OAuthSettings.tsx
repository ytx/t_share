import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack
} from '@mui/material';
import {
  Google,
  Security,
  Key,
  Check,
  Warning,
  Error
} from '@mui/icons-material';
import { RootState } from '../../store';

interface OAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  autoApprove: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const OAuthSettings: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  const [config, setConfig] = useState<OAuthConfig>({
    enabled: false,
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: ['openid', 'profile', 'email'],
    autoApprove: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  // 設定を読み込む
  useEffect(() => {
    loadOAuthConfig();
  }, []);

  const getAuthHeaders = () => {
    console.log('OAuth Settings - Token check:', token ? 'Found' : 'Not found');
    if (!token) {
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const loadOAuthConfig = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();

      if (!headers) {
        setMessage({ type: 'error', text: '認証が必要です。再度ログインしてください。' });
        return;
      }

      const response = await fetch('/api/admin/oauth/google/config', {
        headers
      });

      if (response.status === 401) {
        setMessage({ type: 'error', text: '認証が必要です。再度ログインしてください。' });
        return;
      }

      if (response.status === 403) {
        setMessage({ type: 'error', text: '管理者権限が必要です。' });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || config);
      } else {
        setMessage({ type: 'error', text: 'OAuth設定の読み込みに失敗しました' });
      }
    } catch (error) {
      console.error('OAuth設定の読み込みに失敗:', error);
      setMessage({ type: 'error', text: '認証エラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 設定の検証
  const validateConfig = (newConfig: OAuthConfig): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (newConfig.enabled) {
      if (!newConfig.clientId.trim()) {
        errors.push('クライアントIDは必須です');
      } else if (!newConfig.clientId.includes('.googleusercontent.com')) {
        warnings.push('クライアントIDの形式が正しくない可能性があります');
      }

      if (!newConfig.clientSecret.trim()) {
        errors.push('クライアントシークレットは必須です');
      }

      if (!newConfig.redirectUri.trim()) {
        errors.push('リダイレクトURIは必須です');
      } else if (!newConfig.redirectUri.startsWith('http')) {
        errors.push('リダイレクトURIは有効なURLである必要があります');
      }

      if (newConfig.scopes.length === 0) {
        errors.push('少なくとも1つのスコープが必要です');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  // 設定値の更新
  const handleConfigChange = (field: keyof OAuthConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setValidation(validateConfig(newConfig));
  };

  // 設定のテスト
  const testOAuthConfig = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();

      if (!headers) {
        setMessage({ type: 'error', text: '認証が必要です。再度ログインしてください。' });
        return;
      }

      const response = await fetch('/api/admin/oauth/google/test', {
        method: 'POST',
        headers,
        body: JSON.stringify(config)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '設定のテストが成功しました' });
      } else {
        setMessage({ type: 'error', text: result.error || '設定のテストに失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '設定のテストに失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 設定の保存
  const saveOAuthConfig = async () => {
    if (!validation.isValid) {
      setMessage({ type: 'error', text: '設定に問題があります。エラーを修正してください。' });
      return;
    }

    try {
      setIsSaving(true);
      const headers = getAuthHeaders();

      if (!headers) {
        setMessage({ type: 'error', text: '認証が必要です。再度ログインしてください。' });
        return;
      }

      const response = await fetch('/api/admin/oauth/google/config', {
        method: 'PUT',
        headers,
        body: JSON.stringify(config)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'OAuth設定が保存されました' });
      } else {
        setMessage({ type: 'error', text: result.error || '設定の保存に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  // スコープの追加/削除
  const handleScopeToggle = (scope: string) => {
    const newScopes = config.scopes.includes(scope)
      ? config.scopes.filter(s => s !== scope)
      : [...config.scopes, scope];
    handleConfigChange('scopes', newScopes);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const recommendedScopes = ['openid', 'profile', 'email'];
  const additionalScopes = ['https://www.googleapis.com/auth/userinfo.profile'];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Google color="primary" />
        Google OAuth設定
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* 検証結果表示 */}
      {validation.errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            <Error sx={{ verticalAlign: 'middle', mr: 1 }} />
            エラー:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            <Warning sx={{ verticalAlign: 'middle', mr: 1 }} />
            警告:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validation.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 基本設定 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                基本設定
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.enabled}
                    onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                  />
                }
                label="Google OAuth を有効にする"
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="クライアントID"
                    value={config.clientId}
                    onChange={(e) => handleConfigChange('clientId', e.target.value)}
                    disabled={!config.enabled}
                    placeholder="000000000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                    helperText="Google Cloud ConsoleのOAuth 2.0クライアントIDを入力してください"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="クライアントシークレット"
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                    disabled={!config.enabled}
                    placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    helperText="Google Cloud Consoleのクライアントシークレットを入力してください"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="リダイレクトURI"
                    value={config.redirectUri}
                    onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
                    disabled={!config.enabled}
                    placeholder="https://your-domain.com/auth/google/callback"
                    helperText="Google OAuthコールバック用のURIを入力してください"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* スコープ設定 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                スコープ設定
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Googleから取得する情報の種類を選択してください
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  推奨スコープ:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {recommendedScopes.map((scope) => (
                    <Chip
                      key={scope}
                      label={scope}
                      onClick={() => handleScopeToggle(scope)}
                      color={config.scopes.includes(scope) ? "primary" : "default"}
                      variant={config.scopes.includes(scope) ? "filled" : "outlined"}
                      disabled={!config.enabled}
                      icon={config.scopes.includes(scope) ? <Check /> : undefined}
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  追加スコープ:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {additionalScopes.map((scope) => (
                    <Chip
                      key={scope}
                      label={scope.split('/').pop()}
                      onClick={() => handleScopeToggle(scope)}
                      color={config.scopes.includes(scope) ? "primary" : "default"}
                      variant={config.scopes.includes(scope) ? "filled" : "outlined"}
                      disabled={!config.enabled}
                      icon={config.scopes.includes(scope) ? <Check /> : undefined}
                    />
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 承認設定 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ユーザー承認設定
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.autoApprove}
                    onChange={(e) => handleConfigChange('autoApprove', e.target.checked)}
                    disabled={!config.enabled}
                  />
                }
                label="新規ユーザーを自動承認する"
              />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                {config.autoApprove
                  ? "新規ユーザーは管理者の承認なしで即座にシステムにアクセスできます"
                  : "新規ユーザーは管理者の承認を待つ必要があります"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* セキュリティ情報 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security color="warning" />
                セキュリティに関する注意事項
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>重要:</strong> クライアントシークレットは機密情報です。
                  安全に管理し、第三者に漏らさないよう注意してください。
                </Typography>
              </Alert>

              <Typography variant="body2" component="div">
                <strong>Google Cloud Console設定手順:</strong>
                <ol style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>Google Cloud Consoleでプロジェクトを作成または選択</li>
                  <li>Google+ APIを有効化</li>
                  <li>OAuth 2.0 クライアントIDを作成</li>
                  <li>承認済みリダイレクトURIを設定</li>
                  <li>クライアントIDとシークレットをこの画面に入力</li>
                </ol>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={testOAuthConfig}
          disabled={!config.enabled || !validation.isValid || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <Key />}
        >
          設定をテスト
        </Button>

        <Button
          variant="contained"
          onClick={saveOAuthConfig}
          disabled={!validation.isValid || isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : <Check />}
        >
          設定を保存
        </Button>
      </Box>
    </Box>
  );
};

export default OAuthSettings;