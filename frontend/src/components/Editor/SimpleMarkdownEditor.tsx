import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Box, CircularProgress } from '@mui/material';
import MarkdownEditor from './MarkdownEditor';
import TemplateCreateModal from '../Templates/TemplateCreateModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useGetUserPreferencesQuery, EditorSettings } from '../../store/api/userPreferenceApi';
import {
  useGetPersonalMemoQuery,
  useUpdateDocumentMutation
} from '../../store/api/documentApi';

interface SimpleMarkdownEditorProps {
  selectedProjectId?: number;
  onMoveToUpperEditor?: (text: string) => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

export interface SimpleMarkdownEditorRef {
  flush: () => Promise<void>;
}

const SimpleMarkdownEditor = forwardRef<SimpleMarkdownEditorRef, SimpleMarkdownEditorProps>(({ selectedProjectId, onMoveToUpperEditor, onUnsavedChanges }, ref) => {
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markdownEditorRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);
  const isComposingRef = useRef(false); // IME入力中フラグ
  const [showTemplateCreate, setShowTemplateCreate] = useState(false);
  const [templateInitialContent, setTemplateInitialContent] = useState('');

  // Keep contentRef in sync with content
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // User preferences and theme
  const { data: userPreferences } = useGetUserPreferencesQuery();
  const { mode: themeMode } = useTheme();

  // API hooks - プロジェクトIDを渡してプロジェクトごとのメモを取得
  const { data: memoResponse, isLoading } = useGetPersonalMemoQuery(selectedProjectId, {
    refetchOnMountOrArgChange: true,
  });
  const [updateDocument] = useUpdateDocumentMutation();

  const personalMemo = memoResponse?.data;

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
  useEffect(() => {
    if (userPreferences?.editorSettings) {
      setEditorSettings(prev => ({ ...prev, ...userPreferences.editorSettings }));
    }
  }, [userPreferences]);

  // 個人メモ取得時に内容を設定
  useEffect(() => {
    if (personalMemo) {
      console.log('SimpleMarkdownEditor: Loading memo for project', selectedProjectId, 'content length:', personalMemo.content?.length);
      setContent(personalMemo.content || '');
      setHasUnsavedChanges(false);
      if (onUnsavedChanges) {
        onUnsavedChanges(false);
      }
    }
  }, [personalMemo, onUnsavedChanges, selectedProjectId]);

  // 自動保存処理
  const autoSave = useCallback(async () => {
    if (!personalMemo) {
      return;
    }

    const currentContent = contentRef.current;
    try {
      console.log('SimpleMarkdownEditor: Saving content, length:', currentContent.length);
      await updateDocument({
        id: personalMemo.id,
        data: {
          content: currentContent,
          contentMarkdown: currentContent,
          title: 'メモ（自分用）',
        },
      }).unwrap();
      setHasUnsavedChanges(false);
      if (onUnsavedChanges) {
        onUnsavedChanges(false);
      }
      console.log('SimpleMarkdownEditor: Save successful');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [personalMemo, updateDocument, onUnsavedChanges]);

  // 即座に保存（タイマーをキャンセルして即座に実行）
  const flush = useCallback(async () => {
    // Cancel any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    // Save immediately if there are unsaved changes
    if (hasUnsavedChanges && personalMemo) {
      const currentContent = contentRef.current;
      await updateDocument({
        id: personalMemo.id,
        data: {
          content: currentContent,
          contentMarkdown: currentContent,
          title: 'メモ（自分用）',
        },
      }).unwrap();
      setHasUnsavedChanges(false);
    }
  }, [hasUnsavedChanges, personalMemo, updateDocument]);

  // 外部からアクセス可能な関数を公開
  useImperativeHandle(ref, () => ({
    flush,
  }), [flush]);

  // 内容変更時の処理
  const handleContentChange = useCallback((newContent: string) => {
    console.log('SimpleMarkdownEditor: Content changed, new length:', newContent.length);
    setContent(newContent);
    setHasUnsavedChanges(true);
    if (onUnsavedChanges) {
      onUnsavedChanges(true);
    }

    // 自動保存タイマーをリセット
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // IME入力中は自動保存をスキップ
    if (isComposingRef.current) {
      console.log('SimpleMarkdownEditor: Skipping auto-save during IME composition');
      return;
    }

    // 3秒後に自動保存
    saveTimeoutRef.current = setTimeout(() => {
      console.log('SimpleMarkdownEditor: Auto-save timer triggered');
      autoSave();
    }, 3000);
  }, [autoSave, onUnsavedChanges]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // IME event handlers
  const handleCompositionStart = useCallback(() => {
    console.log('SimpleMarkdownEditor: IME composition started');
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    console.log('SimpleMarkdownEditor: IME composition ended');
    isComposingRef.current = false;

    // IME入力確定後に自動保存タイマーを開始
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      console.log('SimpleMarkdownEditor: Auto-save after IME composition');
      autoSave();
    }, 3000);
  }, [autoSave]);

  // Handler for moving text to upper editor
  const handleMoveToUpperEditor = useCallback((text: string) => {
    if (onMoveToUpperEditor) {
      onMoveToUpperEditor(text);
    }
  }, [onMoveToUpperEditor]);

  // Handler for creating template from selected text
  const handleCreateTemplate = useCallback((text: string) => {
    setTemplateInitialContent(text);
    setShowTemplateCreate(true);
  }, []);

  const handleTemplateCreateSuccess = useCallback(() => {
    setShowTemplateCreate(false);
    setTemplateInitialContent('');
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    >
      <MarkdownEditor
        ref={markdownEditorRef}
        value={content}
        onChange={handleContentChange}
        height="100%"
        aceTheme={themeMode === 'dark' ? editorSettings.darkTheme : editorSettings.lightTheme}
        showLineNumbers={editorSettings.showLineNumbers}
        wordWrap={editorSettings.wordWrap}
        fontSize={editorSettings.fontSize}
        keybinding={editorSettings.keybinding}
        showWhitespace={editorSettings.showWhitespace}
        editorId="simple-markdown-editor"
        placeholder="自分用のメモを作成してください（自動保存されます）..."
        onMoveToUpperEditor={handleMoveToUpperEditor}
        onCreateTemplate={handleCreateTemplate}
      />

      {/* Template Create Modal */}
      <TemplateCreateModal
        open={showTemplateCreate}
        onClose={() => {
          setShowTemplateCreate(false);
          setTemplateInitialContent('');
        }}
        onSuccess={handleTemplateCreateSuccess}
        initialContent={templateInitialContent}
      />
    </Box>
  );
});

SimpleMarkdownEditor.displayName = 'SimpleMarkdownEditor';

export default SimpleMarkdownEditor;
