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
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Category,
  Merge,
  Analytics,
} from '@mui/icons-material';
import { useGetAllScenesQuery, useCreateSceneMutation, useUpdateSceneMutation, useDeleteSceneMutation } from '../../store/api/sceneApi';
import { Scene, SceneFormData } from '../../types';

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
      id={`scene-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>{children}</Box>}
    </div>
  );
}

const SceneManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [scenesToMerge, setScenesToMerge] = useState<{ source: Scene | null; target: Scene | null }>({
    source: null,
    target: null,
  });

  const [formData, setFormData] = useState<SceneFormData>({
    name: '',
    description: '',
    color: '#1976d2',
  });

  const { data: scenesResponse, isLoading, error } = useGetAllScenesQuery();
  const [createScene, { isLoading: isCreating }] = useCreateSceneMutation();
  const [updateScene, { isLoading: isUpdating }] = useUpdateSceneMutation();
  const [deleteScene, { isLoading: isDeleting }] = useDeleteSceneMutation();

  const scenes = scenesResponse?.scenes || [];

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setEditingScene(null);
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
    });
    setOpenDialog(true);
  }, []);

  const handleOpenEditDialog = useCallback((scene: Scene) => {
    setEditingScene(scene);
    setFormData({
      name: scene.name,
      description: scene.description || '',
      color: scene.color || '#1976d2',
    });
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingScene(null);
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      if (editingScene) {
        await updateScene({
          id: editingScene.id,
          data: formData,
        }).unwrap();
      } else {
        await createScene(formData).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('シーンの保存に失敗しました:', error);
    }
  }, [formData, editingScene, createScene, updateScene, handleCloseDialog]);

  const handleDeleteClick = useCallback((scene: Scene) => {
    setSceneToDelete(scene);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (sceneToDelete) {
      try {
        await deleteScene(sceneToDelete.id).unwrap();
        setDeleteConfirmOpen(false);
        setSceneToDelete(null);
      } catch (error) {
        console.error('シーンの削除に失敗しました:', error);
      }
    }
  }, [sceneToDelete, deleteScene]);

  const handleMergeClick = useCallback(() => {
    setScenesToMerge({ source: null, target: null });
    setMergeDialogOpen(true);
  }, []);

  const handleMergeSubmit = useCallback(async () => {
    if (scenesToMerge.source && scenesToMerge.target) {
      // TODO: Implement scene merge functionality
      console.log('Merging scenes:', scenesToMerge);
      setMergeDialogOpen(false);
      setScenesToMerge({ source: null, target: null });
    }
  }, [scenesToMerge]);

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
        シーン情報の読み込み中にエラーが発生しました
      </Alert>
    );
  }

  return (
    <Box>
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<Category />} label="シーン一覧" />
            <Tab icon={<Merge />} label="統合" />
            <Tab icon={<Analytics />} label="統計" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Scene List */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">シーン管理</Typography>
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
                      <TableCell>シーン名</TableCell>
                      <TableCell>説明</TableCell>
                      <TableCell>色</TableCell>
                      <TableCell>テンプレート数</TableCell>
                      <TableCell>作成日</TableCell>
                      <TableCell>更新日</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scenes.map((scene) => (
                      <TableRow key={scene.id}>
                        <TableCell>
                          <Chip
                            label={scene.name}
                            sx={{
                              bgcolor: (scene.color || '#1976d2') + '20',
                              borderColor: scene.color || '#1976d2',
                              color: scene.color || '#1976d2',
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {scene.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: scene.color || '#1976d2',
                                border: '1px solid #ccc',
                              }}
                            />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {scene.color || '#1976d2'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {scene.templateCount || 0}件
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDate(scene.createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatDate(scene.updatedAt)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(scene)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(scene)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {scenes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            シーンがありません
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
          {/* Scene Merge */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              シーンの統合
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              重複するシーンや類似するシーンを統合して、一貫性を保ちます。
            </Typography>
            <Button
              variant="contained"
              startIcon={<Merge />}
              onClick={handleMergeClick}
            >
              シーンを統合
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Scene Statistics */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              シーン統計
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      総シーン数
                    </Typography>
                    <Typography variant="h4">
                      {scenes.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      使用中シーン
                    </Typography>
                    <Typography variant="h4">
                      {scenes.filter(scene => (scene.templateCount || 0) > 0).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      未使用シーン
                    </Typography>
                    <Typography variant="h4">
                      {scenes.filter(scene => (scene.templateCount || 0) === 0).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      平均テンプレート数
                    </Typography>
                    <Typography variant="h4">
                      {scenes.length > 0
                        ? Math.round(scenes.reduce((sum, scene) => sum + (scene.templateCount || 0), 0) / scenes.length)
                        : 0
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingScene ? 'シーン編集' : '新規シーン作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="シーン名"
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

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                シーン色
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Color Palette */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    '#1976d2', '#d32f2f', '#388e3c', '#f57c00',
                    '#7b1fa2', '#c2185b', '#00796b', '#455a64',
                    '#5d4037', '#616161', '#e91e63', '#9c27b0',
                    '#673ab7', '#3f51b5', '#2196f3', '#03a9f4',
                  ].map((color) => (
                    <Box
                      key={color}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: color,
                        border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="カラーコード"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    size="small"
                    sx={{ width: 140 }}
                  />
                  <Chip
                    label={formData.name || 'プレビュー'}
                    sx={{
                      bgcolor: formData.color + '20',
                      borderColor: formData.color,
                      color: formData.color,
                    }}
                  />
                </Box>
              </Box>
            </Box>
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
        <DialogTitle>シーン削除の確認</DialogTitle>
        <DialogContent>
          <Typography>
            「{sceneToDelete?.name}」を削除しますか？このシーンが使用されているテンプレートからも削除されます。この操作は取り消せません。
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

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>シーンの統合</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              統合元のシーンを統合先のシーンに統合します。統合元のシーンは削除され、そのシーンが使用されていたテンプレートには統合先のシーンが適用されます。
            </Typography>

            <FormControl fullWidth>
              <InputLabel>統合元シーン</InputLabel>
              <Select
                value={scenesToMerge.source?.id || ''}
                onChange={(e) => {
                  const scene = scenes.find(s => s.id === Number(e.target.value));
                  setScenesToMerge(prev => ({ ...prev, source: scene || null }));
                }}
                label="統合元シーン"
              >
                {scenes.map(scene => (
                  <MenuItem key={scene.id} value={scene.id}>
                    <Chip
                      label={scene.name}
                      sx={{
                        bgcolor: (scene.color || '#1976d2') + '20',
                        borderColor: scene.color || '#1976d2',
                        color: scene.color || '#1976d2',
                      }}
                      size="small"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>統合先シーン</InputLabel>
              <Select
                value={scenesToMerge.target?.id || ''}
                onChange={(e) => {
                  const scene = scenes.find(s => s.id === Number(e.target.value));
                  setScenesToMerge(prev => ({ ...prev, target: scene || null }));
                }}
                label="統合先シーン"
              >
                {scenes.filter(scene => scene.id !== scenesToMerge.source?.id).map(scene => (
                  <MenuItem key={scene.id} value={scene.id}>
                    <Chip
                      label={scene.name}
                      sx={{
                        bgcolor: (scene.color || '#1976d2') + '20',
                        borderColor: scene.color || '#1976d2',
                        color: scene.color || '#1976d2',
                      }}
                      size="small"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleMergeSubmit}
            color="warning"
            variant="contained"
            disabled={!scenesToMerge.source || !scenesToMerge.target}
          >
            統合実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SceneManagement;