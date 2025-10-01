import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Box, Alert, CircularProgress, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { NoteAdd, ArrowUpward } from '@mui/icons-material';
import MarkdownEditor from './MarkdownEditor';
import TemplateCreateModal from '../Templates/TemplateCreateModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useGetUserPreferencesQuery, EditorSettings } from '../../store/api/userPreferenceApi';
import {
  useGetSharedProjectDocumentQuery,
  useUpdateDocumentMutation
} from '../../store/api/documentApi';

interface ProjectEditorProps {
  selectedProjectId?: number;
  onMoveToUpperEditor?: (text: string) => void;
}

export interface ProjectEditorRef {
  flush: () => Promise<void>;
}

const ProjectEditor = forwardRef<ProjectEditorRef, ProjectEditorProps>(({
  selectedProjectId,
  onMoveToUpperEditor,
}, ref) => {
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const markdownEditorRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showTemplateCreate, setShowTemplateCreate] = useState(false);

  // Keep contentRef in sync with content
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // User preferences and theme
  const { data: userPreferences } = useGetUserPreferencesQuery();
  const { mode: themeMode } = useTheme();

  // API hooks
  const { data: documentResponse, isLoading } = useGetSharedProjectDocumentQuery(
    selectedProjectId!,
    { skip: !selectedProjectId }
  );
  const [updateDocument] = useUpdateDocumentMutation();

  const sharedDocument = documentResponse?.data;

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

  // プロジェクト変更時・共有文書取得時に内容を設定
  useEffect(() => {
    if (sharedDocument) {
      setContent(sharedDocument.content || '');
      setHasUnsavedChanges(false);
    } else if (!selectedProjectId) {
      setContent('');
      setHasUnsavedChanges(false);
    }
  }, [sharedDocument, selectedProjectId]);

  // 自動保存処理
  const autoSave = useCallback(async () => {
    if (!selectedProjectId || !sharedDocument) {
      return;
    }

    const currentContent = contentRef.current;
    try {
      console.log('ProjectEditor: Saving content, length:', currentContent.length, 'last char code:', currentContent.length > 0 ? currentContent.charCodeAt(currentContent.length - 1) : 'N/A');
      await updateDocument({
        id: sharedDocument.id,
        data: {
          content: currentContent,
          contentMarkdown: currentContent,
          title: 'プロジェクト内共有',
          projectId: selectedProjectId,
        },
      }).unwrap();
      setHasUnsavedChanges(false);
      console.log('ProjectEditor: Save successful');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [selectedProjectId, sharedDocument, updateDocument]);

  // 即座に保存（タイマーをキャンセルして即座に実行）
  const flush = useCallback(async () => {
    // Cancel any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    // Save immediately if there are unsaved changes
    if (hasUnsavedChanges && selectedProjectId && sharedDocument) {
      const currentContent = contentRef.current;
      await updateDocument({
        id: sharedDocument.id,
        data: {
          content: currentContent,
          contentMarkdown: currentContent,
          title: 'プロジェクト内共有',
          projectId: selectedProjectId,
        },
      }).unwrap();
      setHasUnsavedChanges(false);
    }
  }, [hasUnsavedChanges, selectedProjectId, sharedDocument, updateDocument]);

  // 外部からアクセス可能な関数を公開
  useImperativeHandle(ref, () => ({
    flush,
  }), [flush]);

  // 内容変更時の処理
  const handleContentChange = useCallback((newContent: string) => {
    console.log('ProjectEditor: Content changed, new length:', newContent.length);
    setContent(newContent);
    setHasUnsavedChanges(true);

    // 自動保存タイマーをリセット
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 3秒後に自動保存
    saveTimeoutRef.current = setTimeout(() => {
      console.log('ProjectEditor: Auto-save timer triggered');
      autoSave();
    }, 3000);
  }, [autoSave]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Context menu handlers
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation(); // Stop event propagation to prevent double menu

    // Get selected text from MarkdownEditor ref
    let selection = '';
    if (markdownEditorRef.current?.getSelectedText) {
      selection = markdownEditorRef.current.getSelectedText();
      console.log('ProjectEditor context menu - selected text:', selection);
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

  if (!selectedProjectId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Alert severity="info">プロジェクトを選択してください</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
      {/* Status Indicator */}
      {hasUnsavedChanges && (
        <Box sx={{ mb: 1 }}>
          <Alert severity="warning" sx={{ py: 0 }}>
            未保存の変更があります（3秒後に自動保存）
          </Alert>
        </Box>
      )}

      {/* Editor */}
      <Box
        sx={{ flex: 1, minHeight: 0 }}
        onContextMenuCapture={handleContextMenu}
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
          editorId="project-editor"
          placeholder="プロジェクト内で共有される文書を編集してください（自動保存されます）..."
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

ProjectEditor.displayName = 'ProjectEditor';

export default ProjectEditor;
