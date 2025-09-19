import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Save,
  ContentCopy,
  FolderOpen,
  Clear,
  ViewList,
} from '@mui/icons-material';
import MarkdownEditor from './MarkdownEditor';
import TemplateSelectionModal from '../Templates/TemplateSelectionModal';
import VariableSubstitutionModal from '../Templates/VariableSubstitutionModal';
import TemplateCreateModal from '../Templates/TemplateCreateModal';
import DocumentViewerModal from '../Documents/DocumentViewerModal';
import { Template } from '../../types';
import { useCreateDocumentMutation, useGetProjectDocumentsQuery } from '../../store/api/documentApi';
import { useGetUserPreferencesQuery, useUpdateEditorSettingsMutation } from '../../store/api/userPreferenceApi';
import { useTheme } from '../../contexts/ThemeContext';
import { getFromLocalStorage, saveEditorContent } from '../../utils/localStorage';

interface DocumentEditorProps {
  selectedTemplate?: Template | null;
  onSaveDocument?: (data: {
    title?: string;
    content: string;
    contentMarkdown: string;
    projectId?: number;
  }) => void;
  onUseTemplate?: (templateId: number) => void;
  onTemplateProcessed?: () => void;
  selectedProjectId?: number;
  selectedSceneId?: number;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  selectedTemplate,
  onSaveDocument,
  onUseTemplate,
  onTemplateProcessed,
  selectedProjectId,
  selectedSceneId,
}) => {
  // Initialize editor content from localStorage
  const storedData = getFromLocalStorage();
  const [content, setContent] = useState(storedData.editorContent || '');
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [showProjectAlert, setShowProjectAlert] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [lastProcessedTemplateId, setLastProcessedTemplateId] = useState<number | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  const markdownEditorRef = useRef<any>(null);
  const [createDocument, { isLoading: isSaving }] = useCreateDocumentMutation();

  // プロジェクトの文書を取得
  const { data: projectDocuments } = useGetProjectDocumentsQuery(selectedProjectId!, {
    skip: !selectedProjectId,
  });

  // User preferences and theme
  const { data: userPreferences } = useGetUserPreferencesQuery();
  const [updateEditorSettings] = useUpdateEditorSettingsMutation();
  const { mode: themeMode } = useTheme();

  // モーダル状態
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showVariableSubstitution, setShowVariableSubstitution] = useState(false);
  const [templateForSubstitution, setTemplateForSubstitution] = useState<Template | null>(null);
  const [showTemplateCreate, setShowTemplateCreate] = useState(false);

  // エディタ設定（ユーザ設定から取得）
  const [editorSettings, setEditorSettings] = useState({
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
      setEditorSettings(userPreferences.editorSettings);
    }
  }, [userPreferences]);

  // プロジェクト変更時に選択された文書をリセット
  React.useEffect(() => {
    setSelectedDocumentId('');
  }, [selectedProjectId]);

  // エディタ内容変更時にローカルストレージに保存
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveEditorContent(content);
    }, 500); // 500ms のデバウンス

    return () => clearTimeout(timeoutId);
  }, [content]);



  // エディタ設定変更時にAPIに保存
  const handleEditorSettingChange = useCallback((newSettings: Partial<typeof editorSettings>) => {
    const updatedSettings = { ...editorSettings, ...newSettings };
    setEditorSettings(updatedSettings);

    // APIに保存
    updateEditorSettings(newSettings).catch(error => {
      console.error('エディタ設定の保存に失敗しました:', error);
    });
  }, [editorSettings, updateEditorSettings]);

  const handleTemplateInsert = useCallback((template: Template) => {
    // 3秒以内の連続クリックを防ぐ
    if (lastProcessedTemplateId === template.id) {
      return;
    }

    // 変数が含まれているかチェック
    const hasVariables = /\{\{\w+\}\}/.test(template.content);
    // チェックボックスが含まれているかチェック（[?] と [*] のパターン）
    const hasCheckboxes = /\[\?\]|\[\*\]/.test(template.content);

    if (hasVariables || hasCheckboxes) {
      // 変数置換・チェックボックス設定モーダルを表示
      setTemplateForSubstitution(template);
      setShowVariableSubstitution(true);
    } else {
      // テキストを挿入
      if (markdownEditorRef.current && markdownEditorRef.current.insertText) {
        markdownEditorRef.current.insertText('\n' + template.content);
      }
      if (onUseTemplate) {
        onUseTemplate(template.id);
      }
    }

    // 処理済みテンプレートIDを設定
    setLastProcessedTemplateId(template.id);

    // 既存のタイマーをクリア
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    // 3秒後にリセット
    const timeout = setTimeout(() => {
      setLastProcessedTemplateId(null);
    }, 3000);
    processingTimeoutRef.current = timeout;
  }, [lastProcessedTemplateId, onUseTemplate]);

  // テンプレートが選択された時の処理（挿入モードに変更）
  const selectedTemplateRef = useRef<Template | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);

  React.useEffect(() => {
    if (selectedTemplate) {
      const now = Date.now();

      // 同じテンプレートが500ms以内に処理された場合はスキップ
      if (selectedTemplateRef.current?.id === selectedTemplate.id &&
          now - lastProcessedTimeRef.current < 500) {
        return;
      }

      selectedTemplateRef.current = selectedTemplate;
      lastProcessedTimeRef.current = now;

      // handleTemplateInsert を直接呼び出す
      handleTemplateInsert(selectedTemplate);

      // 親コンポーネントに処理完了を通知
      if (onTemplateProcessed) {
        onTemplateProcessed();
      }
    }
  }, [selectedTemplate, handleTemplateInsert, onTemplateProcessed]);

  // コンポーネントのクリーンアップ時にタイマーをクリア
  React.useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const generatedTitle = generateTitle();
      await createDocument({
        title: generatedTitle,
        content,
        contentMarkdown: content,
        projectId: selectedProjectId || undefined,
      }).unwrap();

      if (onSaveDocument) {
        onSaveDocument({
          title: generatedTitle,
          content,
          contentMarkdown: content,
          projectId: selectedProjectId || undefined,
        });
      }
    } catch (error) {
      console.error('文書の保存に失敗しました:', error);
    }
  }, [content, selectedProjectId, createDocument, onSaveDocument]);

  const handleSaveAndCopy = useCallback(async () => {
    if (!content.trim()) return;

    if (!selectedProjectId) {
      setShowProjectAlert(true);
      return;
    }

    try {
      const generatedTitle = generateTitle();

      // 1. まず保存を実行
      await createDocument({
        title: generatedTitle,
        content,
        contentMarkdown: content,
        projectId: selectedProjectId,
      }).unwrap();

      // 2. 先頭の空行を削除してからコピー
      const contentToCopy = content.replace(/^\s*\n+/, '');
      await navigator.clipboard.writeText(contentToCopy);
      setShowCopyAlert(true);

      // 3. エディタをクリア
      setContent('');

      if (onSaveDocument) {
        onSaveDocument({
          title: generatedTitle,
          content,
          contentMarkdown: content,
          projectId: selectedProjectId,
        });
      }
    } catch (error) {
      console.error('文書の保存・コピーに失敗しました:', error);
    }
  }, [content, selectedProjectId, createDocument, onSaveDocument]);

  // 現在のプロジェクトの保存された文書を取得
  // サーバーから取得した文書データを使用（ドロップダウン用は最新20件）
  const currentProjectDocuments = projectDocuments?.data?.slice(0, 20) || [];
  // 全文書リストをモーダル用に取得
  const allDocuments = projectDocuments?.data || [];

  const handleDocumentSelect = useCallback((documentId: string) => {
    const document = currentProjectDocuments.find(doc => doc.id.toString() === documentId);
    if (document) {
      setContent(document.content);
      setSelectedDocumentId(documentId);
    }
  }, [currentProjectDocuments]);

  const handleClear = useCallback(() => {
    setContent('');
    setSelectedDocumentId('');
  }, []);

  const handleOpenDocumentViewer = useCallback(() => {
    setShowDocumentViewer(true);
  }, []);

  const handleDocumentFromViewer = useCallback((document: any) => {
    setContent(document.content);
  }, []);


  const handleTemplateEdit = useCallback((template: Template) => {
    // TODO: 定型文編集モーダルを開く
    console.log('定型文編集:', template);
  }, []);

  const handleVariableSubstitution = useCallback((processedContent: string, variables: Record<string, string>) => {
    // 変数置換後のテキストを挿入
    if (markdownEditorRef.current && markdownEditorRef.current.insertText) {
      markdownEditorRef.current.insertText('\n' + processedContent);
    }
    if (templateForSubstitution && onUseTemplate) {
      onUseTemplate(templateForSubstitution.id);
    }
    setTemplateForSubstitution(null);
  }, [templateForSubstitution, onUseTemplate]);

  const handleVariableSubstitutionClose = useCallback(() => {
    setShowVariableSubstitution(false);
    setTemplateForSubstitution(null);

    // キャンセル時はタイマーをリセット（すぐに再度クリックできるようにする）
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    setLastProcessedTemplateId(null);

    // useEffectの重複処理防止もリセット
    lastProcessedTimeRef.current = 0;
    selectedTemplateRef.current = null;

    // 親コンポーネントに処理完了を通知（キャンセル時も）
    if (onTemplateProcessed) {
      onTemplateProcessed();
    }
  }, [onTemplateProcessed]);

  const handleCreateTemplateFromSelection = useCallback(() => {
    let selectedText = '';

    // MarkdownEditorのref経由で選択テキストを取得
    if (markdownEditorRef.current && markdownEditorRef.current.getSelectedText) {
      selectedText = markdownEditorRef.current.getSelectedText();
    }

    console.log('Create template button - Selected text:', {
      length: selectedText.length,
      lines: selectedText.split('\n').length,
      text: selectedText
    });

    if (selectedText && selectedText.trim()) {
      setSelectedText(selectedText.trim());
      setShowTemplateCreate(true);
    } else {
      // 選択テキストがない場合は全体のコンテンツを使用
      setSelectedText(content);
      setShowTemplateCreate(true);
    }
  }, [content]);

  const handleTemplateCreateSuccess = useCallback(() => {
    setShowTemplateCreate(false);
    setSelectedText('');
    // 定型文作成成功のメッセージを表示（必要に応じて）
  }, []);

  // Generate title from content
  const generateTitle = () => {
    if (!content.trim()) return '新規文書';

    const lines = content.split('\n');
    const firstNonEmptyLine = lines.find(line => line.trim() !== '');
    if (!firstNonEmptyLine) return '新規文書';

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const dateStr = `${year}/${month}/${day} ${hours}:${minutes}`;
    const contentPreview = firstNonEmptyLine.trim().substring(0, 20);

    return `${dateStr} - ${contentPreview}`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Editor with Action Buttons */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        {/* Action Buttons - positioned absolutely in top right */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 8,
          zIndex: 10,
          display: 'flex',
          gap: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 'none',
          p: 0.5,
          alignItems: 'center'
        }}>
          <IconButton
            size="small"
            onClick={handleOpenDocumentViewer}
            sx={{
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              }
            }}
            title="全ての文書を表示"
          >
            <ViewList />
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>保存された文書</InputLabel>
            <Select
              value={selectedDocumentId}
              onChange={(e) => handleDocumentSelect(e.target.value as string)}
              label="保存された文書"
              startAdornment={<FolderOpen sx={{ mr: 1, fontSize: 16 }} />}
              disabled={currentProjectDocuments.length === 0}
            >
              <MenuItem value="">
                <em>文書を選択</em>
              </MenuItem>
              {currentProjectDocuments.map((doc) => (
                <MenuItem key={doc.id} value={doc.id.toString()}>
                  {doc.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveAndCopy}
            disabled={!content.trim()}
            size="small"
          >
            保存・コピー
          </Button>

          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClear}
            disabled={!content.trim()}
            size="small"
            color="secondary"
          >
            クリア
          </Button>
        </Box>

        <Box sx={{ pt: 6 }}>
          <MarkdownEditor
            ref={markdownEditorRef}
            value={content}
            onChange={setContent}
            height="calc(100vh - 120px)"
            aceTheme={themeMode === 'dark' ? editorSettings.darkTheme : editorSettings.lightTheme}
            showLineNumbers={editorSettings.showLineNumbers}
            wordWrap={editorSettings.wordWrap}
            fontSize={editorSettings.fontSize}
            keybinding={editorSettings.keybinding}
            showWhitespace={editorSettings.showWhitespace}
            onCreateTemplate={(selectedText) => {
              setSelectedText(selectedText);
              setShowTemplateCreate(true);
            }}
            placeholder={
              selectedTemplate
                ? 'テンプレートの内容を編集してください...'
                : 'マークダウンで文書を作成してください...'
            }
          />
        </Box>
      </Box>

      {/* Save and Copy Success Snackbar */}
      <Snackbar
        open={showCopyAlert}
        autoHideDuration={3000}
        onClose={() => setShowCopyAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowCopyAlert(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          文書を保存し、クリップボードにコピーしました
        </Alert>
      </Snackbar>

      {/* Project Selection Alert Snackbar */}
      <Snackbar
        open={showProjectAlert}
        autoHideDuration={5000}
        onClose={() => setShowProjectAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowProjectAlert(false)}
          severity="warning"
          sx={{ width: '100%' }}
        >
          文書を保存するにはプロジェクトを選択してください
        </Alert>
      </Snackbar>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        open={showTemplateSelection}
        onClose={() => setShowTemplateSelection(false)}
        onInsert={handleTemplateInsert}
        onEditTemplate={handleTemplateEdit}
        title="エディタに挿入する定型文を選択"
      />

      {/* Variable Substitution Modal */}
      {templateForSubstitution && (
        <VariableSubstitutionModal
          open={showVariableSubstitution}
          onClose={handleVariableSubstitutionClose}
          onApply={handleVariableSubstitution}
          template={templateForSubstitution}
          projectId={selectedProjectId || undefined}
        />
      )}

      {/* Template Create Modal */}
      <TemplateCreateModal
        open={showTemplateCreate}
        onClose={() => {
          setShowTemplateCreate(false);
          setSelectedText('');
        }}
        onSuccess={handleTemplateCreateSuccess}
        initialContent={selectedText}
        initialSceneId={selectedSceneId}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        open={showDocumentViewer}
        onClose={() => setShowDocumentViewer(false)}
        documents={allDocuments}
        onOpenDocument={handleDocumentFromViewer}
      />
    </Box>
  );
};

export default DocumentEditor;