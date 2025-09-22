import React, { useState, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import MarkdownEditor from './MarkdownEditor';
import { useTheme } from '../../contexts/ThemeContext';
import { useGetUserPreferencesQuery, EditorSettings } from '../../store/api/userPreferenceApi';
import { getFromLocalStorage } from '../../utils/localStorage';

interface SimpleMarkdownEditorProps {
  selectedProjectId?: number;
}

const SimpleMarkdownEditor: React.FC<SimpleMarkdownEditorProps> = ({
  selectedProjectId,
}) => {
  // ローカルストレージからプロジェクト連動で内容を初期化
  const getInitialContent = useCallback(() => {
    const storedData = getFromLocalStorage();
    if (selectedProjectId && storedData.projectEditorContent && storedData.projectEditorContent[selectedProjectId]) {
      return storedData.projectEditorContent[selectedProjectId];
    }
    return '';
  }, [selectedProjectId]);

  const [content, setContent] = useState(getInitialContent());
  const markdownEditorRef = useRef<any>(null);

  // User preferences and theme
  const { data: userPreferences } = useGetUserPreferencesQuery();
  const { mode: themeMode } = useTheme();

  // エディタ設定（ユーザ設定から取得）
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    lightTheme: 'github',
    darkTheme: 'monokai',
    showLineNumbers: true,
    wordWrap: true,
    fontSize: 14,
    keybinding: 'default' as 'default' | 'vim' | 'emacs',
    showWhitespace: false,
  });

  // ユーザ設定からエディタ設定を初期化
  React.useEffect(() => {
    if (userPreferences?.editorSettings) {
      setEditorSettings(prev => ({ ...prev, ...userPreferences.editorSettings }));
    }
  }, [userPreferences]);

  // プロジェクト変更時に内容を切り替え
  React.useEffect(() => {
    const newContent = getInitialContent();
    setContent(newContent);
  }, [selectedProjectId, getInitialContent]);

  // エディタ内容変更時にプロジェクト連動でローカルストレージに保存
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedProjectId) {
        const storedData = getFromLocalStorage();
        const projectEditorContent = storedData.projectEditorContent || {};
        projectEditorContent[selectedProjectId] = content;

        localStorage.setItem('t-share-app-state', JSON.stringify({
          ...storedData,
          projectEditorContent
        }));
      }
    }, 500); // 500ms のデバウンス

    return () => clearTimeout(timeoutId);
  }, [content, selectedProjectId]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
      <MarkdownEditor
        ref={markdownEditorRef}
        value={content}
        onChange={setContent}
        height="100%"
        aceTheme={themeMode === 'dark' ? editorSettings.darkTheme : editorSettings.lightTheme}
        showLineNumbers={editorSettings.showLineNumbers}
        wordWrap={editorSettings.wordWrap}
        fontSize={editorSettings.fontSize}
        keybinding={editorSettings.keybinding}
        showWhitespace={editorSettings.showWhitespace}
        editorId="simple-markdown-editor"
        placeholder={
          selectedProjectId
            ? 'プロジェクト用のメモやドラフトを作成してください...'
            : 'プロジェクトを選択するとメモを作成できます...'
        }
      />
    </Box>
  );
};

export default SimpleMarkdownEditor;