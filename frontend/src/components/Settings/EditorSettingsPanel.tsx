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
  Slider,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  useGetUserPreferencesQuery,
  useUpdateEditorSettingsMutation,
} from '../../store/api/userPreferenceApi';

const EditorSettingsPanel: React.FC = () => {
  const { data: preferences, isLoading } = useGetUserPreferencesQuery();
  const [updateEditorSettings] = useUpdateEditorSettingsMutation();

  const editorSettings = preferences?.editorSettings || {
    theme: 'light',
    showLineNumbers: true,
    wordWrap: true,
    fontSize: 14,
    keybinding: 'default',
    showWhitespace: false,
  };

  const handleSettingChange = async (setting: string, value: any) => {
    try {
      await updateEditorSettings({
        ...editorSettings,
        [setting]: value,
      }).unwrap();
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
        {/* テーマ設定 */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">エディタテーマ</FormLabel>
            <RadioGroup
              value={editorSettings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              row
            >
              <FormControlLabel
                value="light"
                control={<Radio />}
                label="ライト"
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label="ダーク"
              />
            </RadioGroup>
          </FormControl>
        </Paper>

        {/* キーバインディング */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">キーバインディング</FormLabel>
            <RadioGroup
              value={editorSettings.keybinding}
              onChange={(e) => handleSettingChange('keybinding', e.target.value)}
            >
              <FormControlLabel
                value="default"
                control={<Radio />}
                label="デフォルト"
              />
              <FormControlLabel
                value="vim"
                control={<Radio />}
                label="Vim"
              />
              <FormControlLabel
                value="emacs"
                control={<Radio />}
                label="Emacs"
              />
            </RadioGroup>
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