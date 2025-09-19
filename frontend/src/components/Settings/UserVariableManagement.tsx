import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
} from '@mui/icons-material';
import {
  useGetUserVariablesQuery,
  useCreateUserVariableMutation,
  useUpdateUserVariableMutation,
  useDeleteUserVariableMutation,
} from '../../store/api/userVariableApi';
import ConfirmDialog from '../Common/ConfirmDialog';

interface UserVariable {
  id: number;
  name: string;
  value: string;
  description?: string;
}

interface VariableFormData {
  name: string;
  value: string;
  description: string;
}

const UserVariableManagement: React.FC = () => {
  const { data: variablesResponse, isLoading } = useGetUserVariablesQuery();
  const [createVariable] = useCreateUserVariableMutation();
  const [updateVariable] = useUpdateUserVariableMutation();
  const [deleteVariable] = useDeleteUserVariableMutation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<UserVariable | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<UserVariable | null>(null);

  const [formData, setFormData] = useState<VariableFormData>({
    name: '',
    value: '',
    description: '',
  });

  const variables = variablesResponse?.data || [];

  const handleCreate = () => {
    setFormData({ name: '', value: '', description: '' });
    setEditingVariable(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (variable: UserVariable) => {
    setFormData({
      name: variable.name,
      value: variable.value,
      description: variable.description || '',
    });
    setEditingVariable(variable);
    setShowCreateDialog(true);
  };

  const handleDelete = (variable: UserVariable) => {
    setVariableToDelete(variable);
    setShowDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingVariable) {
        // 更新
        await updateVariable({
          id: editingVariable.id,
          ...formData,
        }).unwrap();
      } else {
        // 新規作成
        await createVariable(formData).unwrap();
      }
      setShowCreateDialog(false);
      setEditingVariable(null);
    } catch (error) {
      console.error('変数の保存に失敗しました:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (variableToDelete) {
      try {
        await deleteVariable(variableToDelete.id).unwrap();
        setShowDeleteDialog(false);
        setVariableToDelete(null);
      } catch (error) {
        console.error('変数の削除に失敗しました:', error);
      }
    }
  };

  const handleFormChange = (field: keyof VariableFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return <Box sx={{ p: 3 }}>読み込み中...</Box>;
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          ユーザ変数管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          変数を追加
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        ユーザ変数は定型文で <code>{`{{変数名}}`}</code> の形式で使用できます。
        例: <code>{`{{name}}`}</code>, <code>{`{{email}}`}</code>
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>変数名</TableCell>
              <TableCell>値</TableCell>
              <TableCell>説明</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {variables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  変数がありません
                </TableCell>
              </TableRow>
            ) : (
              variables.map((variable) => (
                <TableRow key={variable.id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {`{{${variable.name}}}`}
                    </Typography>
                  </TableCell>
                  <TableCell>{variable.value}</TableCell>
                  <TableCell>{variable.description || '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="編集">
                      <IconButton size="small" onClick={() => handleEdit(variable)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton size="small" onClick={() => handleDelete(variable)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 作成・編集ダイアログ */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingVariable ? '変数を編集' : '変数を追加'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="変数名"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="name, email, company など"
              helperText="半角英数字とアンダースコアのみ使用可能"
              fullWidth
              required
            />
            <TextField
              label="値"
              value={formData.value}
              onChange={(e) => handleFormChange('value', e.target.value)}
              placeholder="変数に代入される値"
              fullWidth
              required
            />
            <TextField
              label="説明"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="この変数の用途や説明"
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCreateDialog(false)}
            startIcon={<Cancel />}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<Save />}
            disabled={!formData.name.trim() || !formData.value.trim()}
          >
            {editingVariable ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="変数を削除"
        content={`変数「${variableToDelete?.name}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        severity="error"
      />
    </Box>
  );
};

export default UserVariableManagement;