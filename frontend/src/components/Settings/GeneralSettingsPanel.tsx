import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Paper,
  Alert,
} from '@mui/material';
import {
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
} from '../../store/api/userPreferenceApi';

const GeneralSettingsPanel: React.FC = () => {
  const { data: preferences, isLoading } = useGetUserPreferencesQuery();
  const [updatePreferences] = useUpdateUserPreferencesMutation();

  const handleLanguageChange = async (language: 'ja' | 'en') => {
    try {
      await updatePreferences({ language }).unwrap();
    } catch (error) {
      console.error('言語設定の更新に失敗しました:', error);
    }
  };

  if (isLoading) {
    return <Box sx={{ p: 3 }}>読み込み中...</Box>;
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        全般設定
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 言語設定 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">言語</FormLabel>
            <RadioGroup
              value={preferences?.language || 'ja'}
              onChange={(e) => handleLanguageChange(e.target.value as 'ja' | 'en')}
            >
              <FormControlLabel
                value="ja"
                control={<Radio />}
                label="日本語"
              />
              <FormControlLabel
                value="en"
                control={<Radio />}
                label="English"
                disabled
              />
            </RadioGroup>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            現在は日本語のみサポートしています。英語対応は今後のアップデートで提供予定です。
          </Alert>
        </Paper>

        {/* アカウント情報 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            アカウント情報
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ユーザー設定やデータは自動的に保存されます。
            </Typography>
            <Typography variant="body2" color="text.secondary">
              設定をエクスポート・インポートして他のデバイスと同期できます。
            </Typography>
          </Box>
        </Paper>

        {/* データ管理 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            データ管理
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              • テンプレート、文書、変数データは自動的にバックアップされます
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 設定は画面上部のボタンからエクスポート・インポートできます
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • すべての設定をデフォルトに戻すには「設定をリセット」を使用してください
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default GeneralSettingsPanel;