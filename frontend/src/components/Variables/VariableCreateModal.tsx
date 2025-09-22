import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
} from '@mui/material';
import { useCreateUserVariableMutation } from '../../store/api/userVariableApi';
import { useCreateProjectVariableMutation } from '../../store/api/projectVariableApi';

interface VariableCreateModalProps {
  open: boolean;
  onClose: () => void;
  variableType: 'user' | 'project';
  projectId?: number;
}

const VariableCreateModal: React.FC<VariableCreateModalProps> = ({
  open,
  onClose,
  variableType,
  projectId,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createUserVariable, { isLoading: isCreatingUser }] = useCreateUserVariableMutation();
  const [createProjectVariable, { isLoading: isCreatingProject }] = useCreateProjectVariableMutation();

  const isLoading = isCreatingUser || isCreatingProject;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '変数名は必須です';
    } else if (formData.name.length > 50) {
      newErrors.name = '変数名は50文字以内で入力してください';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = '変数名は英字で始まり、英数字とアンダースコアのみ使用可能です';
    }

    if (!formData.value.trim()) {
      newErrors.value = '値は必須です';
    } else if (formData.value.length > 1000) {
      newErrors.value = '値は1000文字以内で入力してください';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '説明は500文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (variableType === 'user') {
        await createUserVariable({
          name: formData.name,
          value: formData.value,
          description: formData.description || undefined,
        }).unwrap();
      } else if (variableType === 'project' && projectId) {
        await createProjectVariable({
          projectId,
          data: {
            name: formData.name,
            value: formData.value,
            description: formData.description || undefined,
          },
        }).unwrap();
      }

      handleClose();
    } catch (error: any) {
      if (error?.data?.error?.includes('already exists')) {
        setErrors({ name: '同じ名前の変数が既に存在します' });
      } else {
        console.error('変数の作成に失敗しました:', error);
      }
    }
  };

  const handleClose = () => {
    setFormData({ name: '', value: '', description: '' });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {variableType === 'user' ? 'ユーザ変数を追加' : 'プロジェクト変数を追加'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="変数名"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!errors.name}
            helperText={errors.name || '英字で始まり、英数字とアンダースコアのみ使用可能'}
            fullWidth
            placeholder="例: userName, projectName"
          />

          <TextField
            label="値"
            value={formData.value}
            onChange={handleInputChange('value')}
            error={!!errors.value}
            helperText={errors.value}
            fullWidth
            multiline
            rows={3}
            placeholder="変数の値を入力してください"
          />

          <TextField
            label="説明（任意）"
            value={formData.description}
            onChange={handleInputChange('description')}
            error={!!errors.description}
            helperText={errors.description || 'この変数の用途や説明を入力してください'}
            fullWidth
            multiline
            rows={2}
            placeholder="例: ユーザの表示名として使用"
          />

          <Alert severity="info">
            テンプレート内で {`{{${formData.name || '変数名'}}}`} の形式で使用できます
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? '作成中...' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariableCreateModal;