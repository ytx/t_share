import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Paper,
} from '@mui/material';
import { Info, ContentCopy } from '@mui/icons-material';
import { Template } from '../../types';
import { useGetUserVariablesQuery } from '../../store/api/userVariableApi';
import { useGetProjectVariablesQuery } from '../../store/api/projectVariableApi';

interface Variable {
  name: string;
  value: string;
  description?: string;
  type: 'user' | 'project' | 'template';
}

interface CheckboxLine {
  index: number;
  content: string;
  checked: boolean;
  included: boolean;
}

interface VariableSubstitutionModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (content: string, variables: Record<string, string>) => void;
  template: Template;
  projectId?: number;
}

const VariableSubstitutionModal: React.FC<VariableSubstitutionModalProps> = ({
  open,
  onClose,
  onApply,
  template,
  projectId,
}) => {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');
  const [foundVariables, setFoundVariables] = useState<string[]>([]);
  const [checkboxLines, setCheckboxLines] = useState<CheckboxLine[]>([]);

  // Fetch variables from API
  const { data: userVariablesResponse, isLoading: isLoadingUser } = useGetUserVariablesQuery();
  const { data: projectVariablesResponse, isLoading: isLoadingProject } = useGetProjectVariablesQuery(
    projectId || 0,
    { skip: !projectId }
  );

  const userVariables = userVariablesResponse?.data.reduce((acc, variable) => {
    acc[variable.name] = variable.value;
    return acc;
  }, {} as Record<string, string>) || {};

  const projectVariables = projectVariablesResponse?.data.reduce((acc, variable) => {
    acc[variable.name] = variable.value;
    return acc;
  }, {} as Record<string, string>) || {};

  const isLoading = isLoadingUser || (projectId && isLoadingProject);

  // テンプレート内の変数を抽出
  useEffect(() => {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = [...template.content.matchAll(variablePattern)];
    const uniqueVariables = [...new Set(matches.map(match => match[1]))];

    setFoundVariables(uniqueVariables);

    // 既存の変数値で初期化
    const initialVariables: Record<string, string> = {};
    uniqueVariables.forEach(varName => {
      initialVariables[varName] =
        userVariables[varName] ||
        projectVariables[varName] ||
        '';
    });
    setVariables(initialVariables);
  }, [template.content, userVariablesResponse, projectVariablesResponse]);

  // テンプレート内のチェックボックス行を抽出
  useEffect(() => {
    const lines = template.content.split('\n');
    const checkboxLinesList: CheckboxLine[] = [];

    lines.forEach((line, index) => {
      // [?]を含む行をチェックボックス行として判別
      if (line.includes('[?]')) {
        checkboxLinesList.push({
          index,
          content: line,
          checked: false,
          included: true, // デフォルトで含める
        });
      }
    });

    setCheckboxLines(checkboxLinesList);
  }, [template.content]);

  // プレビューコンテンツを更新
  useEffect(() => {
    let content = template.content;

    // 変数置換
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    });

    // チェックボックス行の除外処理と[?]の削除
    if (checkboxLines.length > 0) {
      const lines = content.split('\n');
      const filteredLines = lines
        .filter((line, index) => {
          const checkboxLine = checkboxLines.find(cb => cb.index === index);
          return !checkboxLine || checkboxLine.included;
        })
        .map(line => {
          // [?]を削除
          return line.replace(/\[\?\]/g, '');
        });
      content = filteredLines.join('\n');
    } else {
      // チェックボックス行がない場合でも[?]を削除
      content = content.replace(/\[\?\]/g, '');
    }

    setPreviewContent(content);
  }, [template.content, variables, checkboxLines]);

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxLineChange = (index: number, included: boolean) => {
    setCheckboxLines(prev =>
      prev.map(line =>
        line.index === index ? { ...line, included } : line
      )
    );
  };

  const handleApply = () => {
    onApply(previewContent, variables);
    onClose();
  };

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗:', error);
    }
  };

  const getVariableSource = (varName: string): { type: 'user' | 'project' | 'none'; value?: string } => {
    if (userVariables[varName]) {
      return { type: 'user', value: userVariables[varName] };
    }
    if (projectVariables[varName]) {
      return { type: 'project', value: projectVariables[varName] };
    }
    return { type: 'none' };
  };

  const allVariablesFilled = foundVariables.every(varName => variables[varName]?.trim());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">変数の置換</Typography>
          <Chip
            label={template.title}
            color="primary"
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : foundVariables.length === 0 && checkboxLines.length === 0 ? (
          <Alert severity="info">
            このテンプレートには置換可能な変数やチェックボックスがありません。
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
            {/* 変数入力エリア */}
            <Box sx={{ flex: 1 }}>
              {foundVariables.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    変数の設定
                  </Typography>

                  <List dense>
                    {foundVariables.map(varName => {
                      const source = getVariableSource(varName);
                      return (
                        <ListItem key={varName} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                              {`{{${varName}}}`}
                            </Typography>
                            {source.type !== 'none' && (
                              <Chip
                                label={source.type === 'user' ? 'ユーザ変数' : 'プロジェクト変数'}
                                size="small"
                                color={source.type === 'user' ? 'primary' : 'secondary'}
                                variant="outlined"
                              />
                            )}
                          </Box>

                          <TextField
                            fullWidth
                            size="small"
                            value={variables[varName] || ''}
                            onChange={(e) => handleVariableChange(varName, e.target.value)}
                            placeholder={`${varName}の値を入力`}
                            helperText={source.value ? `デフォルト値: ${source.value}` : undefined}
                            disabled={isLoading}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </>
              )}

              {/* チェックボックス行の設定 */}
              {checkboxLines.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: foundVariables.length > 0 ? 3 : 0 }}>
                    チェックボックス行の設定
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    含めたい行にチェックを入れてください
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    {checkboxLines.map((checkboxLine) => (
                      <FormControlLabel
                        key={checkboxLine.index}
                        control={
                          <Checkbox
                            checked={checkboxLine.included}
                            onChange={(e) => handleCheckboxLineChange(checkboxLine.index, e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {checkboxLine.content.replace(/\[\?\]/g, '')}
                          </Typography>
                        }
                        sx={{ width: '100%', mb: 0.5 }}
                      />
                    ))}
                  </Paper>
                </>
              )}

              {/* 共通変数のヒント */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>よく使われる変数例:</strong><br />
                  • date: 日付<br />
                  • name: 名前<br />
                  • project: プロジェクト名<br />
                  • location: 場所
                </Typography>
              </Alert>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* プレビューエリア */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  プレビュー
                </Typography>
                <Tooltip title="プレビューをコピー">
                  <IconButton size="small" onClick={handleCopyPreview}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  height: '400px',
                  overflow: 'auto',
                  bgcolor: 'grey.50',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {previewContent || template.content}
              </Box>

              {!allVariablesFilled && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  すべての変数に値を設定してください
                </Alert>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          キャンセル
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={foundVariables.length > 0 && !allVariablesFilled}
        >
          適用
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariableSubstitutionModal;