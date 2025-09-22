import React, { useState, useEffect } from 'react';
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
import { useUpdateUserVariableMutation } from '../../store/api/userVariableApi';
import { useUpdateProjectVariableMutation } from '../../store/api/projectVariableApi';

interface VariableEditModalProps {
  open: boolean;
  onClose: () => void;
  variable: any;
  variableType: 'user' | 'project';
}

const VariableEditModal: React.FC<VariableEditModalProps> = ({
  open,
  onClose,
  variable,
  variableType,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [updateUserVariable, { isLoading: isUpdatingUser }] = useUpdateUserVariableMutation();
  const [updateProjectVariable, { isLoading: isUpdatingProject }] = useUpdateProjectVariableMutation();

  const isLoading = isUpdatingUser || isUpdatingProject;

  useEffect(() => {
    if (variable) {
      setFormData({
        name: variable.name || '',
        value: variable.value || '',
        description: variable.description || '',
      });
    }
  }, [variable]);

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
      const updateData = {
        name: formData.name,
        value: formData.value,
        description: formData.description || undefined,
      };

      if (variableType === 'user') {
        await updateUserVariable({
          id: variable.id,
          data: updateData,
        }).unwrap();
      } else if (variableType === 'project') {
        await updateProjectVariable({
          id: variable.id,
          data: updateData,
        }).unwrap();
      }

      handleClose();
    } catch (error: any) {
      if (error?.data?.error?.includes('already exists')) {
        setErrors({ name: '同じ名前の変数が既に存在します' });
      } else {
        console.error('変数の更新に失敗しました:', error);
      }
    }
  };

  const handleClose = () => {
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
        {variableType === 'user' ? 'ユーザ変数を編集' : 'プロジェクト変数を編集'}
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
          {isLoading ? '更新中...' : '更新'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariableEditModal;