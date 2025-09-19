import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  Divider,
} from '@mui/material';
import {
  useGetUserPreferencesQuery,
  useUpdateNotificationSettingsMutation,
} from '../../store/api/userPreferenceApi';

const NotificationSettingsPanel: React.FC = () => {
  const { data: preferences, isLoading } = useGetUserPreferencesQuery();
  const [updateNotificationSettings] = useUpdateNotificationSettingsMutation();

  const notifications = preferences?.notifications || {
    emailNotifications: true,
    browserNotifications: true,
    soundEnabled: false,
  };

  const handleNotificationChange = async (setting: string, value: boolean) => {
    try {
      await updateNotificationSettings({
        ...notifications,
        [setting]: value,
      }).unwrap();
    } catch (error) {
      console.error('通知設定の更新に失敗しました:', error);
    }
  };

  if (isLoading) {
    return <Box sx={{ p: 3 }}>読み込み中...</Box>;
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        通知設定
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 基本通知設定 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            通知方法
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.emailNotifications}
                  onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                />
              }
              label="メール通知"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.browserNotifications}
                  onChange={(e) => handleNotificationChange('browserNotifications', e.target.checked)}
                />
              }
              label="ブラウザ通知"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.soundEnabled}
                  onChange={(e) => handleNotificationChange('soundEnabled', e.target.checked)}
                />
              }
              label="通知音を有効にする"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            ブラウザ通知を使用するには、ブラウザで通知を許可してください。
          </Typography>
        </Paper>

        {/* 通知内容 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            通知される内容（今後実装予定）
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              • テンプレートの共有やコメント
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • プロジェクトへの招待
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • システムメンテナンス情報
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 新機能のお知らせ
            </Typography>
          </Box>
        </Paper>

        {/* プライバシー */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            プライバシー
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              通知設定はお客様のプライバシーを尊重して設計されています：
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • メールアドレスは通知目的のみに使用されます
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 第三者とのデータ共有は行いません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • いつでも通知を無効にできます
            </Typography>
          </Box>
        </Paper>

        <Alert severity="info">
          現在はベータ版のため、一部の通知機能は今後のアップデートで追加されます。
        </Alert>
      </Box>
    </Box>
  );
};

export default NotificationSettingsPanel;