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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
} from '@mui/icons-material';
import {
  useGetProjectVariablesQuery,
  useCreateProjectVariableMutation,
  useUpdateProjectVariableMutation,
  useDeleteProjectVariableMutation,
} from '../../store/api/projectVariableApi';
import { useGetAllProjectsQuery } from '../../store/api/projectApi';
import ConfirmDialog from '../Common/ConfirmDialog';

interface ProjectVariable {
  id: number;
  name: string;
  value: string;
  description?: string;
  projectId: number;
  project: {
    id: number;
    name: string;
  };
}

interface VariableFormData {
  name: string;
  value: string;
  description: string;
  projectId: number;
}

const ProjectVariableManagement: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const { data: projectsResponse } = useGetAllProjectsQuery();
  const { data: variablesResponse, isLoading } = useGetProjectVariablesQuery(
    selectedProjectId,
    { skip: selectedProjectId === 0 }
  );
  const [createVariable] = useCreateProjectVariableMutation();
  const [updateVariable] = useUpdateProjectVariableMutation();
  const [deleteVariable] = useDeleteProjectVariableMutation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<ProjectVariable | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<ProjectVariable | null>(null);

  const [formData, setFormData] = useState<VariableFormData>({
    name: '',
    value: '',
    description: '',
    projectId: 0,
  });

  const projects = projectsResponse?.data || [];
  const variables = variablesResponse?.data || [];

  const handleCreate = () => {
    setFormData({
      name: '',
      value: '',
      description: '',
      projectId: selectedProjectId || 0
    });
    setEditingVariable(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (variable: ProjectVariable) => {
    setFormData({
      name: variable.name,
      value: variable.value,
      description: variable.description || '',
      projectId: variable.projectId,
    });
    setEditingVariable(variable);
    setShowCreateDialog(true);
  };

  const handleDelete = (variable: ProjectVariable) => {
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

  const handleFormChange = (field: keyof VariableFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        プロジェクト変数管理
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        プロジェクト変数は定型文で <code>{`{{変数名}}`}</code> の形式で使用できます。
        プロジェクトが選択されている場合のみ利用可能です。
      </Alert>

      {/* プロジェクト選択 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          プロジェクトを選択
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>プロジェクト</InputLabel>
          <Select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value as number)}
            label="プロジェクト"
          >
            <MenuItem value={0}>プロジェクトを選択してください</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedProjectId === 0 ? (
        <Alert severity="warning">
          プロジェクトを選択してください
        </Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1">
              {selectedProject?.name} の変数一覧
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              変数を追加
            </Button>
          </Box>

          {isLoading ? (
            <Box sx={{ p: 3 }}>読み込み中...</Box>
          ) : (
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
          )}
        </>
      )}

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
            <FormControl fullWidth required>
              <InputLabel>プロジェクト</InputLabel>
              <Select
                value={formData.projectId}
                onChange={(e) => handleFormChange('projectId', e.target.value as number)}
                label="プロジェクト"
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            disabled={!formData.name.trim() || !formData.value.trim() || !formData.projectId}
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

export default ProjectVariableManagement;