import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { Upload } from '@mui/icons-material';
import { useBulkCreateUserVariablesMutation } from '../../store/api/userVariableApi';
import { useBulkCreateProjectVariablesMutation } from '../../store/api/projectVariableApi';

interface VariableBulkImportModalProps {
  open: boolean;
  onClose: () => void;
  variableType: 'user' | 'project';
  projectId?: number;
}

const VariableBulkImportModal: React.FC<VariableBulkImportModalProps> = ({
  open,
  onClose,
  variableType,
  projectId,
}) => {
  const [importText, setImportText] = useState('');
  const [parsedVariables, setParsedVariables] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const [bulkCreateUserVariables, { isLoading: isCreatingUser }] = useBulkCreateUserVariablesMutation();
  const [bulkCreateProjectVariables, { isLoading: isCreatingProject }] = useBulkCreateProjectVariablesMutation();

  const isLoading = isCreatingUser || isCreatingProject;

  const parseImportText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const variables: any[] = [];
    const parseErrors: string[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Support multiple formats:
      // 1. name=value
      // 2. name=value # description
      // 3. name|value|description
      if (line.includes('=')) {
        const [namePart, ...valueParts] = line.split('=');
        const name = namePart.trim();
        const valueAndDescription = valueParts.join('=');

        let value: string;
        let description: string | undefined;

        if (valueAndDescription.includes('#')) {
          const [valuePart, ...descParts] = valueAndDescription.split('#');
          value = valuePart.trim();
          description = descParts.join('#').trim();
        } else {
          value = valueAndDescription.trim();
        }

        if (!name || !value) {
          parseErrors.push(`行 ${lineNumber}: 変数名と値は必須です`);
          return;
        }

        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
          parseErrors.push(`行 ${lineNumber}: 変数名 "${name}" は英字で始まり、英数字とアンダースコアのみ使用可能です`);
          return;
        }

        variables.push({ name, value, description });
      } else if (line.includes('|')) {
        const parts = line.split('|');
        if (parts.length < 2) {
          parseErrors.push(`行 ${lineNumber}: 変数名と値は必須です`);
          return;
        }

        const name = parts[0].trim();
        const value = parts[1].trim();
        const description = parts[2]?.trim();

        if (!name || !value) {
          parseErrors.push(`行 ${lineNumber}: 変数名と値は必須です`);
          return;
        }

        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
          parseErrors.push(`行 ${lineNumber}: 変数名 "${name}" は英字で始まり、英数字とアンダースコアのみ使用可能です`);
          return;
        }

        variables.push({ name, value, description });
      } else {
        parseErrors.push(`行 ${lineNumber}: 無効な形式です（name=value または name|value|description）`);
      }
    });

    // Check for duplicate names
    const names = variables.map(v => v.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      parseErrors.push(`重複する変数名: ${[...new Set(duplicates)].join(', ')}`);
    }

    setParsedVariables(variables);
    setErrors(parseErrors);
  };

  const handleImportTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setImportText(text);

    if (text.trim()) {
      parseImportText(text);
    } else {
      setParsedVariables([]);
      setErrors([]);
    }
  };

  const handleSubmit = async () => {
    if (parsedVariables.length === 0 || errors.length > 0) {
      return;
    }

    try {
      if (variableType === 'user') {
        await bulkCreateUserVariables({ variables: parsedVariables }).unwrap();
      } else if (variableType === 'project' && projectId) {
        await bulkCreateProjectVariables({
          projectId,
          data: { variables: parsedVariables },
        }).unwrap();
      }

      handleClose();
    } catch (error: any) {
      if (error?.data?.error) {
        setErrors([error.data.error]);
      } else {
        console.error('変数の一括作成に失敗しました:', error);
        setErrors(['変数の一括作成に失敗しました']);
      }
    }
  };

  const handleClose = () => {
    setImportText('');
    setParsedVariables([]);
    setErrors([]);
    onClose();
  };

  const exampleText = `userName=田中太郎 # ユーザの表示名
userEmail=tanaka@example.com
projectName=サンプルプロジェクト
status=進行中`;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Upload />
          {variableType === 'user' ? 'ユーザ変数を一括インポート' : 'プロジェクト変数を一括インポート'}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>対応形式:</strong><br />
              • name=value # description<br />
              • name|value|description<br />
              <br />
              変数名は英字で始まり、英数字とアンダースコアのみ使用可能です。
            </Typography>
          </Alert>

          <TextField
            label="インポートデータ"
            value={importText}
            onChange={handleImportTextChange}
            fullWidth
            multiline
            rows={8}
            placeholder={exampleText}
            helperText="1行に1つの変数を記述してください"
          />

          {errors.length > 0 && (
            <Alert severity="error">
              <Typography variant="body2">
                <strong>エラー:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Typography>
            </Alert>
          )}

          {parsedVariables.length > 0 && errors.length === 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                インポートされる変数 ({parsedVariables.length}件):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 150, overflow: 'auto' }}>
                {parsedVariables.map((variable, index) => (
                  <Chip
                    key={index}
                    label={`{{${variable.name}}}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || parsedVariables.length === 0 || errors.length > 0}
        >
          {isLoading ? 'インポート中...' : `${parsedVariables.length}件をインポート`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariableBulkImportModal;