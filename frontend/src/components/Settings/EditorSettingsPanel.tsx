import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  Slider,
  Paper,
  Alert,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  useGetUserPreferencesQuery,
  useUpdateEditorSettingsMutation,
} from '../../store/api/userPreferenceApi';

const EditorSettingsPanel: React.FC = () => {
  const { data: preferences, isLoading } = useGetUserPreferencesQuery();
  const [updateEditorSettings] = useUpdateEditorSettingsMutation();

  // ACE Editor theme options
  const aceThemes = {
    light: [
      { value: 'github', label: 'GitHub' },
      { value: 'chrome', label: 'Chrome' },
      { value: 'eclipse', label: 'Eclipse' },
      { value: 'textmate', label: 'TextMate' },
      { value: 'xcode', label: 'Xcode' },
      { value: 'katzenmilch', label: 'Katzenmilch' },
      { value: 'kuroir', label: 'Kuroir' },
    ],
    dark: [
      { value: 'monokai', label: 'Monokai' },
      { value: 'twilight', label: 'Twilight' },
      { value: 'vibrant_ink', label: 'Vibrant Ink' },
      { value: 'cobalt', label: 'Cobalt' },
      { value: 'tomorrow_night', label: 'Tomorrow Night' },
      { value: 'tomorrow_night_blue', label: 'Tomorrow Night Blue' },
      { value: 'tomorrow_night_bright', label: 'Tomorrow Night Bright' },
      { value: 'tomorrow_night_eighties', label: 'Tomorrow Night 80s' },
      { value: 'idle_fingers', label: 'Idle Fingers' },
      { value: 'kr_theme', label: 'krTheme' },
      { value: 'merbivore', label: 'Merbivore' },
      { value: 'merbivore_soft', label: 'Merbivore Soft' },
      { value: 'mono_industrial', label: 'Mono Industrial' },
      { value: 'pastel_on_dark', label: 'Pastel on Dark' },
      { value: 'solarized_dark', label: 'Solarized Dark' },
      { value: 'terminal', label: 'Terminal' },
    ],
  };

  const editorSettings = preferences?.editorSettings || {
    lightTheme: 'github',
    darkTheme: 'monokai',
    showLineNumbers: true,
    wordWrap: true,
    fontSize: 14,
    keybinding: 'default',
    showWhitespace: false,
  };

  // Ensure theme values are never undefined
  const lightTheme = editorSettings.lightTheme || 'github';
  const darkTheme = editorSettings.darkTheme || 'monokai';

  const handleSettingChange = async (setting: string, value: any) => {
    try {
      const newSettings = {
        ...editorSettings,
        [setting]: value,
      };
      console.log('EditorSettingsPanel: Updating setting:', setting, 'to:', value);
      console.log('EditorSettingsPanel: New settings object:', newSettings);

      const result = await updateEditorSettings(newSettings).unwrap();
      console.log('EditorSettingsPanel: Update result:', result);
    } catch (error) {
      console.error('エディタ設定の更新に失敗しました:', error);
    }
  };

  if (isLoading) {
    return <Box sx={{ p: 3 }}>読み込み中...</Box>;
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        エディタ設定
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* ACE エディタテーマ設定 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            エディタテーマ
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>ライトモードテーマ</InputLabel>
              <Select
                value={lightTheme}
                onChange={(e) => handleSettingChange('lightTheme', e.target.value)}
                label="ライトモードテーマ"
              >
                {aceThemes.light.map((theme) => (
                  <MenuItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>ダークモードテーマ</InputLabel>
              <Select
                value={darkTheme}
                onChange={(e) => handleSettingChange('darkTheme', e.target.value)}
                label="ダークモードテーマ"
              >
                {aceThemes.dark.map((theme) => (
                  <MenuItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* キーバインディング */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            キーバインディング
          </Typography>
          <FormControl fullWidth>
            <InputLabel>キーバインディング</InputLabel>
            <Select
              value={editorSettings.keybinding}
              onChange={(e) => handleSettingChange('keybinding', e.target.value)}
              label="キーバインディング"
            >
              <MenuItem value="default">デフォルト</MenuItem>
              <MenuItem value="vim">Vim</MenuItem>
              <MenuItem value="emacs">Emacs</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* 表示設定 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            表示設定
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={editorSettings.showLineNumbers}
                  onChange={(e) => handleSettingChange('showLineNumbers', e.target.checked)}
                />
              }
              label="行番号を表示"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editorSettings.wordWrap}
                  onChange={(e) => handleSettingChange('wordWrap', e.target.checked)}
                />
              }
              label="ワードラップ"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editorSettings.showWhitespace}
                  onChange={(e) => handleSettingChange('showWhitespace', e.target.checked)}
                />
              }
              label="空白文字を表示"
            />
          </Box>
        </Paper>

        {/* フォントサイズ */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            フォントサイズ: {editorSettings.fontSize}px
          </Typography>
          <Slider
            value={editorSettings.fontSize}
            onChange={(e, value) => handleSettingChange('fontSize', value)}
            min={8}
            max={24}
            step={1}
            marks={[
              { value: 8, label: '8px' },
              { value: 12, label: '12px' },
              { value: 16, label: '16px' },
              { value: 20, label: '20px' },
              { value: 24, label: '24px' },
            ]}
            valueLabelDisplay="auto"
          />
        </Paper>

        <Alert severity="info">
          エディタ設定は自動的に保存され、すべてのエディタに適用されます。
        </Alert>
      </Box>
    </Box>
  );
};

export default EditorSettingsPanel;