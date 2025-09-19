import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Settings,
  People,
  Code,
} from '@mui/icons-material';
import { useGetAllProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from '../../store/api/projectApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>{children}</Box>}
    </div>
  );
}

interface ProjectFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

const ProjectManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'active',
  });

  const { data: projectsResponse, isLoading, error } = useGetAllProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const projects = projectsResponse?.data || [];

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
    setOpenDialog(true);
  }, []);

  const handleOpenEditDialog = useCallback((project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'active',
    });
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      if (editingProject) {
        await updateProject({
          id: editingProject.id,
          data: formData,
        }).unwrap();
      } else {
        await createProject(formData).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('プロジェクトの保存に失敗しました:', error);
    }
  }, [formData, editingProject, createProject, updateProject, handleCloseDialog]);

  const handleDeleteClick = useCallback((project: any) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete.id).unwrap();
        setDeleteConfirmOpen(false);
        setProjectToDelete(null);
      } catch (error) {
        console.error('プロジェクトの削除に失敗しました:', error);
      }
    }
  }, [projectToDelete, deleteProject]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        プロジェクト情報の読み込み中にエラーが発生しました
      </Alert>
    );
  }

  return (
    <Box>
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<Settings />} label="プロジェクト一覧" />
            <Tab icon={<Code />} label="変数設定" />
            <Tab icon={<People />} label="メンバー管理" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Project List */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">プロジェクト管理</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenCreateDialog}
              >
                新規作成
              </Button>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>プロジェクト名</TableCell>
                      <TableCell>説明</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>作成日</TableCell>
                      <TableCell>更新日</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {project.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {project.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.status === 'active' ? 'アクティブ' : '非アクティブ'}
                            color={project.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(project.createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatDate(project.updatedAt)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(project)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(project)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {projects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            プロジェクトがありません
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              変数設定機能
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              プロジェクト固有の変数設定機能を実装予定
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              メンバー管理機能
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              プロジェクトメンバーの追加・削除・権限管理機能を実装予定
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProject ? 'プロジェクト編集' : '新規プロジェクト作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="プロジェクト名"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="説明"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                label="ステータス"
              >
                <MenuItem value="active">アクティブ</MenuItem>
                <MenuItem value="inactive">非アクティブ</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isCreating || isUpdating || !formData.name.trim()}
          >
            {isCreating || isUpdating ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>プロジェクト削除の確認</DialogTitle>
        <DialogContent>
          <Typography>
            「{projectToDelete?.name}」を削除しますか？この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectManagement;