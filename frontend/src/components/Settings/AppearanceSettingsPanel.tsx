import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Switch,
  Paper,
  Alert,
} from '@mui/material';
import {
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useUpdateUISettingsMutation,
} from '../../store/api/userPreferenceApi';

const AppearanceSettingsPanel: React.FC = () => {
  const { data: preferences, isLoading } = useGetUserPreferencesQuery();
  const [updatePreferences] = useUpdateUserPreferencesMutation();
  const [updateUISettings] = useUpdateUISettingsMutation();

  const uiSettings = preferences?.uiSettings || {
    sidebarOpen: true,
    compactMode: false,
    showMinimap: true,
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    try {
      await updatePreferences({ theme }).unwrap();
    } catch (error) {
      console.error('テーマ設定の更新に失敗しました:', error);
    }
  };

  const handleUISettingChange = async (setting: string, value: any) => {
    try {
      await updateUISettings({
        ...uiSettings,
        [setting]: value,
      }).unwrap();
    } catch (error) {
      console.error('UI設定の更新に失敗しました:', error);
    }
  };

  if (isLoading) {
    return <Box sx={{ p: 3 }}>読み込み中...</Box>;
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        外観設定
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* テーマ設定 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">アプリケーションテーマ</FormLabel>
            <RadioGroup
              value={preferences?.theme || 'auto'}
              onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
            >
              <FormControlLabel
                value="light"
                control={<Radio />}
                label="ライトテーマ"
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label="ダークテーマ"
              />
              <FormControlLabel
                value="auto"
                control={<Radio />}
                label="システム設定に従う"
              />
            </RadioGroup>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            「システム設定に従う」を選択すると、OSのテーマ設定に自動的に合わせて切り替わります。
          </Alert>
        </Paper>

        {/* レイアウト設定 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            レイアウト設定
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={uiSettings.sidebarOpen}
                  onChange={(e) => handleUISettingChange('sidebarOpen', e.target.checked)}
                />
              }
              label="サイドバーを表示"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={uiSettings.compactMode}
                  onChange={(e) => handleUISettingChange('compactMode', e.target.checked)}
                />
              }
              label="コンパクトモード"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={uiSettings.showMinimap}
                  onChange={(e) => handleUISettingChange('showMinimap', e.target.checked)}
                  disabled
                />
              }
              label="ミニマップを表示（今後実装予定）"
            />
          </Box>
        </Paper>

        {/* 表示設定 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            表示に関する注意事項
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              • コンパクトモードでは、UI要素がより小さく表示されます
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • テーマ変更は即座に反映されます
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 一部の設定は次回アプリケーション起動時に反映されます
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AppearanceSettingsPanel;