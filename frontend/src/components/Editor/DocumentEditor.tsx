import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save,
  ContentCopy,
} from '@mui/icons-material';
import MarkdownEditor from './MarkdownEditor';
import TemplateSelectionModal from '../Templates/TemplateSelectionModal';
import VariableSubstitutionModal from '../Templates/VariableSubstitutionModal';
import TemplateCreateModal from '../Templates/TemplateCreateModal';
import { Template } from '../../types';
import { useCreateDocumentMutation } from '../../store/api/documentApi';
import { useGetUserPreferencesQuery, useUpdateEditorSettingsMutation } from '../../store/api/userPreferenceApi';
import { useTheme } from '../../contexts/ThemeContext';

interface DocumentEditorProps {
  selectedTemplate?: Template | null;
  onSaveDocument?: (data: {
    title?: string;
    content: string;
    contentMarkdown: string;
    projectId?: number;
  }) => void;
  onUseTemplate?: (templateId: number) => void;
  selectedProjectId?: number;
  selectedSceneId?: number;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  selectedTemplate,
  onSaveDocument,
  onUseTemplate,
  selectedProjectId,
  selectedSceneId,
}) => {
  const [content, setContent] = useState('');
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const markdownEditorRef = useRef<any>(null);
  const [createDocument, { isLoading: isSaving }] = useCreateDocumentMutation();

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
      console.log('DocumentEditor: Updating editor settings:', userPreferences.editorSettings);
      setEditorSettings(userPreferences.editorSettings);
    }
  }, [userPreferences]);

  // デバッグ用: エディタ設定とテーマモードをログ出力
  React.useEffect(() => {
    console.log('DocumentEditor: Current editor settings:', editorSettings);
    console.log('DocumentEditor: Current theme mode:', themeMode);
    console.log('DocumentEditor: Selected ACE theme:', themeMode === 'dark' ? editorSettings.darkTheme : editorSettings.lightTheme);
  }, [editorSettings, themeMode]);

  // エディタ設定変更時にAPIに保存
  const handleEditorSettingChange = useCallback((newSettings: Partial<typeof editorSettings>) => {
    const updatedSettings = { ...editorSettings, ...newSettings };
    setEditorSettings(updatedSettings);

    // APIに保存
    updateEditorSettings(newSettings).catch(error => {
      console.error('エディタ設定の保存に失敗しました:', error);
    });
  }, [editorSettings, updateEditorSettings]);


  // テンプレートが選択された時の処理（挿入モードに変更）
  React.useEffect(() => {
    if (selectedTemplate) {
      // テキストを挿入（全体置換ではなく）
      if (markdownEditorRef.current && markdownEditorRef.current.insertText) {
        markdownEditorRef.current.insertText(selectedTemplate.content);
      }

      // 使用状況を記録
      if (onUseTemplate) {
        onUseTemplate(selectedTemplate.id);
      }
    }
  }, [selectedTemplate, onUseTemplate]);

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

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopyAlert(true);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
    }
  }, [content]);

  const handleTemplateInsert = useCallback((template: Template) => {
    // 変数が含まれているかチェック
    const hasVariables = /\{\{\w+\}\}/.test(template.content);

    if (hasVariables) {
      // 変数置換モーダルを表示
      setTemplateForSubstitution(template);
      setShowVariableSubstitution(true);
    } else {
      // テキストを挿入
      if (markdownEditorRef.current && markdownEditorRef.current.insertText) {
        markdownEditorRef.current.insertText(template.content);
      }
      if (onUseTemplate) {
        onUseTemplate(template.id);
      }
    }
  }, [onUseTemplate]);

  const handleTemplateEdit = useCallback((template: Template) => {
    // TODO: 定型文編集モーダルを開く
    console.log('定型文編集:', template);
  }, []);

  const handleVariableSubstitution = useCallback((processedContent: string, variables: Record<string, string>) => {
    // 変数置換後のテキストを挿入
    if (markdownEditorRef.current && markdownEditorRef.current.insertText) {
      markdownEditorRef.current.insertText(processedContent);
    }
    if (templateForSubstitution && onUseTemplate) {
      onUseTemplate(templateForSubstitution.id);
    }
    setTemplateForSubstitution(null);
  }, [templateForSubstitution, onUseTemplate]);

  const handleVariableSubstitutionClose = useCallback(() => {
    setShowVariableSubstitution(false);
    setTemplateForSubstitution(null);
  }, []);

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
    const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const contentPreview = firstNonEmptyLine.trim().substring(0, 20);

    return `${dateStr}：${contentPreview}`;
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
          p: 0.5
        }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
            size="small"
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={handleCopyToClipboard}
            disabled={!content.trim()}
            size="small"
          >
            コピー
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

      {/* Copy Success Snackbar */}
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
          クリップボードにコピーしました
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
    </Box>
  );
};

export default DocumentEditor;