import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Box, CircularProgress, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { NoteAdd, ArrowUpward } from '@mui/icons-material';
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
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showTemplateCreate, setShowTemplateCreate] = useState(false);
  const isComposingRef = useRef(false); // IME入力中フラグ

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

  // Context menu handlers
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation(); // Stop event propagation to prevent double menu

    // Get selected text from MarkdownEditor ref
    let selection = '';
    if (markdownEditorRef.current?.getSelectedText) {
      selection = markdownEditorRef.current.getSelectedText();
      console.log('SimpleMarkdownEditor context menu - selected text:', selection);
    }

    setSelectedText(selection);
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleCreateTemplate = useCallback(() => {
    if (!selectedText.trim()) {
      handleCloseContextMenu();
      return;
    }

    // Show template create modal
    setShowTemplateCreate(true);
    handleCloseContextMenu();
  }, [selectedText, handleCloseContextMenu]);

  const handleTemplateCreateSuccess = useCallback(() => {
    setShowTemplateCreate(false);
    setSelectedText('');
    // TODO: Show success notification
  }, []);

  const handleMoveToUpperEditor = useCallback(() => {
    if (!selectedText.trim() || !onMoveToUpperEditor) {
      handleCloseContextMenu();
      return;
    }

    // Remove selected text from current editor by replacing with empty string
    if (markdownEditorRef.current) {
      const currentContent = content;
      const newContent = currentContent.replace(selectedText, '');
      setContent(newContent);
      handleContentChange(newContent);
    }

    // Move to upper editor
    onMoveToUpperEditor(selectedText);

    handleCloseContextMenu();
  }, [selectedText, onMoveToUpperEditor, handleCloseContextMenu, handleContentChange, content]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
      {/* Editor */}
      <Box
        sx={{ flex: 1, minHeight: 0 }}
        onContextMenuCapture={handleContextMenu}
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
        />
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleCreateTemplate} disabled={!selectedText.trim()}>
          <ListItemIcon>
            <NoteAdd fontSize="small" />
          </ListItemIcon>
          <ListItemText>定型文を作成</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMoveToUpperEditor} disabled={!selectedText.trim()}>
          <ListItemIcon>
            <ArrowUpward fontSize="small" />
          </ListItemIcon>
          <ListItemText>上のエディタへ移動</ListItemText>
        </MenuItem>
      </Menu>

      {/* Template Create Modal */}
      <TemplateCreateModal
        open={showTemplateCreate}
        onClose={() => {
          setShowTemplateCreate(false);
          setSelectedText('');
        }}
        onSuccess={handleTemplateCreateSuccess}
        initialContent={selectedText}
      />
    </Box>
  );
});

SimpleMarkdownEditor.displayName = 'SimpleMarkdownEditor';

export default SimpleMarkdownEditor;
