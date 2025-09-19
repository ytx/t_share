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
  Label,
  Merge,
  Analytics,
} from '@mui/icons-material';
import { useGetAllTagsQuery, useCreateTagMutation, useUpdateTagMutation, useDeleteTagMutation } from '../../store/api/tagApi';
import { Tag, TagFormData } from '../../types';

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
      id={`tag-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>{children}</Box>}
    </div>
  );
}

const TagManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [tagsToMerge, setTagsToMerge] = useState<{ source: Tag | null; target: Tag | null }>({
    source: null,
    target: null,
  });

  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    description: '',
    color: '#1976d2',
  });

  const { data: tagsResponse, isLoading, error } = useGetAllTagsQuery();
  const [createTag, { isLoading: isCreating }] = useCreateTagMutation();
  const [updateTag, { isLoading: isUpdating }] = useUpdateTagMutation();
  const [deleteTag, { isLoading: isDeleting }] = useDeleteTagMutation();

  const tags = tagsResponse?.tags || [];

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setEditingTag(null);
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
    });
    setOpenDialog(true);
  }, []);

  const handleOpenEditDialog = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
    });
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingTag(null);
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
      if (editingTag) {
        await updateTag({
          id: editingTag.id,
          data: formData,
        }).unwrap();
      } else {
        await createTag(formData).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('タグの保存に失敗しました:', error);
    }
  }, [formData, editingTag, createTag, updateTag, handleCloseDialog]);

  const handleDeleteClick = useCallback((tag: Tag) => {
    setTagToDelete(tag);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (tagToDelete) {
      try {
        await deleteTag(tagToDelete.id).unwrap();
        setDeleteConfirmOpen(false);
        setTagToDelete(null);
      } catch (error) {
        console.error('タグの削除に失敗しました:', error);
      }
    }
  }, [tagToDelete, deleteTag]);

  const handleMergeClick = useCallback(() => {
    setTagsToMerge({ source: null, target: null });
    setMergeDialogOpen(true);
  }, []);

  const handleMergeSubmit = useCallback(async () => {
    if (tagsToMerge.source && tagsToMerge.target) {
      // TODO: Implement tag merge functionality
      console.log('Merging tags:', tagsToMerge);
      setMergeDialogOpen(false);
      setTagsToMerge({ source: null, target: null });
    }
  }, [tagsToMerge]);

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
        タグ情報の読み込み中にエラーが発生しました
      </Alert>
    );
  }

  return (
    <Box>
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<Label />} label="タグ一覧" />
            <Tab icon={<Merge />} label="統合" />
            <Tab icon={<Analytics />} label="統計" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Tag List */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">タグ管理</Typography>
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
                      <TableCell>タグ名</TableCell>
                      <TableCell>説明</TableCell>
                      <TableCell>色</TableCell>
                      <TableCell>使用回数</TableCell>
                      <TableCell>作成日</TableCell>
                      <TableCell>更新日</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <Chip
                            label={tag.name}
                            sx={{
                              bgcolor: tag.color + '20',
                              borderColor: tag.color,
                              color: tag.color,
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {tag.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: tag.color,
                                border: '1px solid #ccc',
                              }}
                            />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {tag.color}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {tag.usageCount || 0}回
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDate(tag.createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatDate(tag.updatedAt)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(tag)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(tag)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tags.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            タグがありません
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
          {/* Tag Merge */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              タグの統合
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              重複するタグや類似するタグを統合して、一貫性を保ちます。
            </Typography>
            <Button
              variant="contained"
              startIcon={<Merge />}
              onClick={handleMergeClick}
            >
              タグを統合
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Tag Statistics */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              タグ統計
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      総タグ数
                    </Typography>
                    <Typography variant="h4">
                      {tags.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      使用中タグ
                    </Typography>
                    <Typography variant="h4">
                      {tags.filter(tag => (tag.usageCount || 0) > 0).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      未使用タグ
                    </Typography>
                    <Typography variant="h4">
                      {tags.filter(tag => (tag.usageCount || 0) === 0).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      平均使用回数
                    </Typography>
                    <Typography variant="h4">
                      {tags.length > 0
                        ? Math.round(tags.reduce((sum, tag) => sum + (tag.usageCount || 0), 0) / tags.length)
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
          {editingTag ? 'タグ編集' : '新規タグ作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="タグ名"
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
                タグ色
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
        <DialogTitle>タグ削除の確認</DialogTitle>
        <DialogContent>
          <Typography>
            「{tagToDelete?.name}」を削除しますか？このタグが使用されているテンプレートからも削除されます。この操作は取り消せません。
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
        <DialogTitle>タグの統合</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              統合元のタグを統合先のタグに統合します。統合元のタグは削除され、そのタグが使用されていたテンプレートには統合先のタグが適用されます。
            </Typography>

            <FormControl fullWidth>
              <InputLabel>統合元タグ</InputLabel>
              <Select
                value={tagsToMerge.source?.id || ''}
                onChange={(e) => {
                  const tag = tags.find(t => t.id === Number(e.target.value));
                  setTagsToMerge(prev => ({ ...prev, source: tag || null }));
                }}
                label="統合元タグ"
              >
                {tags.map(tag => (
                  <MenuItem key={tag.id} value={tag.id}>
                    <Chip
                      label={tag.name}
                      sx={{
                        bgcolor: tag.color + '20',
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                      size="small"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>統合先タグ</InputLabel>
              <Select
                value={tagsToMerge.target?.id || ''}
                onChange={(e) => {
                  const tag = tags.find(t => t.id === Number(e.target.value));
                  setTagsToMerge(prev => ({ ...prev, target: tag || null }));
                }}
                label="統合先タグ"
              >
                {tags.filter(tag => tag.id !== tagsToMerge.source?.id).map(tag => (
                  <MenuItem key={tag.id} value={tag.id}>
                    <Chip
                      label={tag.name}
                      sx={{
                        bgcolor: tag.color + '20',
                        borderColor: tag.color,
                        color: tag.color,
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
            disabled={!tagsToMerge.source || !tagsToMerge.target}
          >
            統合実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TagManagement;