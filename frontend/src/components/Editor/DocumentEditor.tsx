import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save,
  ContentCopy,
  Clear,
  Settings,
  FolderOpen,
} from '@mui/icons-material';
import MarkdownEditor from './MarkdownEditor';
import TemplateSelectionModal from '../Templates/TemplateSelectionModal';
import VariableSubstitutionModal from '../Templates/VariableSubstitutionModal';
import { Template, Project } from '../../types';
import { useGetAllProjectsQuery } from '../../store/api/projectApi';
import { useCreateDocumentMutation } from '../../store/api/documentApi';
import { useGetUserPreferencesQuery, useUpdateEditorSettingsMutation } from '../../store/api/userPreferenceApi';

interface DocumentEditorProps {
  selectedTemplate?: Template | null;
  onSaveDocument?: (data: {
    title?: string;
    content: string;
    contentMarkdown: string;
    projectId?: number;
  }) => void;
  onUseTemplate?: (templateId: number) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  selectedTemplate,
  onSaveDocument,
  onUseTemplate,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const { data: projectsResponse } = useGetAllProjectsQuery();
  const [createDocument, { isLoading: isSaving }] = useCreateDocumentMutation();

  // User preferences
  const { data: userPreferences } = useGetUserPreferencesQuery();
  const [updateEditorSettings] = useUpdateEditorSettingsMutation();

  // モーダル状態
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showVariableSubstitution, setShowVariableSubstitution] = useState(false);
  const [templateForSubstitution, setTemplateForSubstitution] = useState<Template | null>(null);

  // エディタ設定（ユーザ設定から取得）
  const [editorSettings, setEditorSettings] = useState({
    theme: 'light' as 'light' | 'dark',
    showLineNumbers: true,
    wordWrap: true,
    fontSize: 14,
  });

  // ユーザ設定からエディタ設定を初期化
  React.useEffect(() => {
    if (userPreferences?.editorSettings) {
      setEditorSettings(prev => ({
        ...prev,
        ...userPreferences.editorSettings,
      }));
    }
  }, [userPreferences]);

  // エディタ設定変更時にAPIに保存
  const handleEditorSettingChange = useCallback((newSettings: Partial<typeof editorSettings>) => {
    const updatedSettings = { ...editorSettings, ...newSettings };
    setEditorSettings(updatedSettings);

    // APIに保存
    updateEditorSettings(newSettings).catch(error => {
      console.error('エディタ設定の保存に失敗しました:', error);
    });
  }, [editorSettings, updateEditorSettings]);


  // テンプレートが選択された時の処理
  React.useEffect(() => {
    if (selectedTemplate) {
      setContent(selectedTemplate.content);
      setTitle(selectedTemplate.title + ' - コピー');

      // 使用状況を記録
      if (onUseTemplate) {
        onUseTemplate(selectedTemplate.id);
      }
    }
  }, [selectedTemplate, onUseTemplate]);

  const handleSave = useCallback(async () => {
    try {
      await createDocument({
        title: title || undefined,
        content,
        contentMarkdown: content,
        projectId: selectedProject || undefined,
      }).unwrap();

      if (onSaveDocument) {
        onSaveDocument({
          title: title || undefined,
          content,
          contentMarkdown: content,
          projectId: selectedProject || undefined,
        });
      }
    } catch (error) {
      console.error('文書の保存に失敗しました:', error);
    }
  }, [title, content, selectedProject, createDocument, onSaveDocument]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopyAlert(true);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
    }
  }, [content]);

  const handleClear = useCallback(() => {
    setTitle('');
    setContent('');
    setSelectedProject('');
  }, []);

  const handleTemplateImport = useCallback(() => {
    setShowTemplateSelection(true);
  }, []);

  const handleTemplateSelect = useCallback((template: Template) => {
    // 変数が含まれているかチェック
    const hasVariables = /\{\{\w+\}\}/.test(template.content);

    if (hasVariables) {
      // 変数置換モーダルを表示
      setTemplateForSubstitution(template);
      setShowVariableSubstitution(true);
    } else {
      // 直接適用
      setContent(template.content);
      setTitle(template.title + ' - コピー');
      if (onUseTemplate) {
        onUseTemplate(template.id);
      }
    }
  }, [onUseTemplate]);

  const handleVariableSubstitution = useCallback((processedContent: string, variables: Record<string, string>) => {
    setContent(processedContent);
    if (templateForSubstitution) {
      setTitle(templateForSubstitution.title + ' - 編集済み');
      if (onUseTemplate) {
        onUseTemplate(templateForSubstitution.id);
      }
    }
    setTemplateForSubstitution(null);
  }, [templateForSubstitution, onUseTemplate]);

  const handleVariableSubstitutionClose = useCallback(() => {
    setShowVariableSubstitution(false);
    setTemplateForSubstitution(null);
  }, []);

  const projects = projectsResponse?.data || [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">文書エディタ</Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="テンプレート選択">
              <IconButton onClick={handleTemplateImport} size="small">
                <FolderOpen />
              </IconButton>
            </Tooltip>

            <Tooltip title="エディタ設定">
              <IconButton size="small">
                <Settings />
              </IconButton>
            </Tooltip>

            <Tooltip title="クリア">
              <IconButton onClick={handleClear} size="small">
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Document Settings */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="文書タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            placeholder="文書のタイトルを入力"
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>プロジェクト</InputLabel>
            <Select
              value={selectedProject}
              label="プロジェクト"
              onChange={(e) => setSelectedProject(e.target.value as number)}
            >
              <MenuItem value="">プロジェクトなし</MenuItem>
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={handleCopyToClipboard}
            disabled={!content.trim()}
          >
            コピー
          </Button>
        </Box>

        {/* Template Info */}
        {selectedTemplate && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                選択中のテンプレート: <strong>{selectedTemplate.title}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                作成者: {selectedTemplate.creator?.displayName || selectedTemplate.creator?.username}
                {selectedTemplate.scene && ` • シーン: ${selectedTemplate.scene.name}`}
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Editor */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          height="calc(100vh - 300px)"
          theme={editorSettings.theme}
          showLineNumbers={editorSettings.showLineNumbers}
          wordWrap={editorSettings.wordWrap}
          fontSize={editorSettings.fontSize}
          placeholder={
            selectedTemplate
              ? 'テンプレートの内容を編集してください...'
              : 'マークダウンで文書を作成してください...'
          }
        />
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
        onSelect={handleTemplateSelect}
        title="エディタに挿入するテンプレートを選択"
      />

      {/* Variable Substitution Modal */}
      {templateForSubstitution && (
        <VariableSubstitutionModal
          open={showVariableSubstitution}
          onClose={handleVariableSubstitutionClose}
          onApply={handleVariableSubstitution}
          template={templateForSubstitution}
          projectId={selectedProject || undefined}
        />
      )}
    </Box>
  );
};

export default DocumentEditor;