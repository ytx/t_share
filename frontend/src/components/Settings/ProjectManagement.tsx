import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  useGetUserProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  ProjectCreateData,
  ProjectUpdateData,
} from '../../store/api/projectApi';
import { Project } from '../../types';
import { PROJECT_COLORS } from '../../constants/projectColors';
import PortSettings from './PortSettings';

const ProjectManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectCreateData>({
    name: '',
    description: '',
    isPublic: true,
    color: '#1976d2',
  });

  const { data: projectsResponse, isLoading, error } = useGetUserProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const projects = projectsResponse?.data || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) return;

    try {
      await createProject(projectForm).unwrap();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleEditProject = async () => {
    if (!projectToEdit || !projectForm.name.trim()) return;

    try {
      const updateData: ProjectUpdateData = {
        name: projectForm.name,
        description: projectForm.description,
        isPublic: projectForm.isPublic,
        color: projectForm.color,
      };
      await updateProject({ id: projectToEdit.id, data: updateData }).unwrap();
      setShowEditModal(false);
      resetForm();
      setProjectToEdit(null);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (project._count?.documents && project._count.documents > 0) {
      alert('このプロジェクトには文書が含まれているため削除できません。');
      return;
    }

    if (window.confirm(`プロジェクト「${project.name}」を削除しますか？この操作は取り消せません。`)) {
      try {
        await deleteProject(project.id).unwrap();
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('プロジェクトの削除に失敗しました。');
      }
    }
  };

  const openEditModal = (project: Project) => {
    setProjectToEdit(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      isPublic: project.isPublic,
      color: project.color || '#1976d2',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setProjectForm({
      name: '',
      description: '',
      isPublic: true,
      color: '#1976d2',
    });
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetForm();
    setProjectToEdit(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        プロジェクトの読み込みに失敗しました
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">プロジェクト管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateModal(true)}
        >
          新規作成
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名前</TableCell>
              <TableCell>説明</TableCell>
              <TableCell>公開設定</TableCell>
              <TableCell>文書数</TableCell>
              <TableCell>作成日</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.description || '-'}</TableCell>
                <TableCell>
                  {project.isPublic ? (
                    <Chip
                      icon={<VisibilityIcon />}
                      label="公開"
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Chip
                      icon={<VisibilityOffIcon />}
                      label="非公開"
                      color="default"
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>{project._count?.documents || 0}</TableCell>
                <TableCell>{formatDate(project.createdAt)}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => openEditModal(project)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteProject(project)}
                    color="error"
                    disabled={isDeleting}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  プロジェクトがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Project Modal */}
      <Dialog open={showCreateModal} onClose={closeCreateModal} maxWidth="sm" fullWidth>
        <DialogTitle>新しいプロジェクト</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="プロジェクト名"
            fullWidth
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            error={!projectForm.name.trim()}
            helperText={!projectForm.name.trim() ? 'プロジェクト名は必須です' : ''}
          />
          <TextField
            margin="dense"
            label="説明"
            fullWidth
            multiline
            rows={3}
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
          />

          {/* Color Selection */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>プロジェクトカラー</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(color => (
                <Tooltip key={color.value} title={color.name}>
                  <Box
                    onClick={() => setProjectForm({ ...projectForm, color: color.value })}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: color.value,
                      border: projectForm.color === color.value ? '3px solid black' : '1px solid #ccc',
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={projectForm.isPublic}
                onChange={(e) => setProjectForm({ ...projectForm, isPublic: e.target.checked })}
              />
            }
            label="公開プロジェクト"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateModal}>キャンセル</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={isCreating || !projectForm.name.trim()}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={showEditModal} onClose={closeEditModal} maxWidth="sm" fullWidth>
        <DialogTitle>プロジェクト編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="プロジェクト名"
            fullWidth
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            error={!projectForm.name.trim()}
            helperText={!projectForm.name.trim() ? 'プロジェクト名は必須です' : ''}
          />
          <TextField
            margin="dense"
            label="説明"
            fullWidth
            multiline
            rows={3}
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
          />

          {/* Color Selection */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>プロジェクトカラー</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(color => (
                <Tooltip key={color.value} title={color.name}>
                  <Box
                    onClick={() => setProjectForm({ ...projectForm, color: color.value })}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: color.value,
                      border: projectForm.color === color.value ? '3px solid black' : '1px solid #ccc',
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Port Settings (only for existing projects) */}
          {projectToEdit && (
            <>
              <Divider sx={{ my: 3 }} />
              <PortSettings projectId={projectToEdit.id} />
            </>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={projectForm.isPublic}
                onChange={(e) => setProjectForm({ ...projectForm, isPublic: e.target.checked })}
              />
            }
            label="公開プロジェクト"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditModal}>キャンセル</Button>
          <Button
            onClick={handleEditProject}
            variant="contained"
            disabled={isUpdating || !projectForm.name.trim()}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectManagement;