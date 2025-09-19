import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit, Close, AddCircle } from '@mui/icons-material';
import { useUpdateTemplateMutation } from '../../store/api/templateApi';
import { useGetAllScenesQuery, useCreateSceneMutation } from '../../store/api/sceneApi';
import { useGetAllTagsQuery, useCreateTagMutation } from '../../store/api/tagApi';
import { Template, TemplateFormData } from '../../types';

interface TemplateEditModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  template: Template | null;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  open,
  onClose,
  onSuccess,
  template,
}) => {
  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    content: '',
    description: '',
    sceneId: undefined,
    status: 'published',
    isPublic: true,
    tagIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewSceneForm, setShowNewSceneForm] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#1976d2');

  const [updateTemplate, { isLoading }] = useUpdateTemplateMutation();
  const [createScene, { isLoading: isCreatingScene }] = useCreateSceneMutation();
  const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();
  const { data: scenesData } = useGetAllScenesQuery();
  const { data: tagsData } = useGetAllTagsQuery();

  const scenes = scenesData?.scenes || [];
  const tags = tagsData?.tags || [];

  // テンプレートデータでフォームを初期化
  useEffect(() => {
    if (open && template) {
      setFormData({
        title: template.title || '',
        content: template.content || '',
        description: template.description || '',
        sceneId: template.sceneId || undefined,
        status: 'published',
        isPublic: template.isPublic ?? true,
        tagIds: template.templateTags?.map(({ tag }) => tag.id) || [],
      });
      setErrors({});
    }
  }, [open, template]);

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      description: '',
      sceneId: undefined,
      status: 'published',
      isPublic: true,
      tagIds: [],
    });
    setErrors({});
    setShowNewSceneForm(false);
    setNewSceneName('');
    setShowNewTagForm(false);
    setNewTagName('');
    setNewTagColor('#1976d2');
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.title && formData.title.length > 200) {
      newErrors.title = 'タイトルは200文字以内で入力してください';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'コンテンツは必須です';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = '説明は1000文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTitleFromContent = (content: string): string => {
    const lines = content.split('\n');
    const firstNonEmptyLine = lines.find(line => line.trim() !== '');
    return firstNonEmptyLine ? firstNonEmptyLine.trim() : '無題の定型文';
  };

  const handleSubmit = async () => {
    if (!template || !validateForm()) {
      return;
    }

    try {
      const submissionData = {
        ...formData,
        title: formData.title.trim() || generateTitleFromContent(formData.content)
      };

      await updateTemplate({
        id: template.id,
        data: submissionData
      }).unwrap();

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Template update failed:', error);
      setErrors({ submit: '定型文の更新に失敗しました' });
    }
  };

  const handleCreateNewScene = async () => {
    if (!newSceneName.trim()) {
      setErrors({ scene: 'シーン名を入力してください' });
      return;
    }

    try {
      const result = await createScene({ name: newSceneName.trim() }).unwrap();
      setFormData(prev => ({ ...prev, sceneId: result.scene.id }));
      setShowNewSceneForm(false);
      setNewSceneName('');
      setErrors({});
    } catch (error) {
      console.error('Scene creation failed:', error);
      setErrors({ scene: 'シーンの作成に失敗しました' });
    }
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) {
      setErrors({ tag: 'タグ名を入力してください' });
      return;
    }

    try {
      const result = await createTag({
        name: newTagName.trim(),
        color: newTagColor
      }).unwrap();
      setFormData(prev => ({
        ...prev,
        tagIds: [...prev.tagIds, result.tag.id]
      }));
      setShowNewTagForm(false);
      setNewTagName('');
      setNewTagColor('#1976d2');
      setErrors({});
    } catch (error) {
      console.error('Tag creation failed:', error);
      setErrors({ tag: 'タグの作成に失敗しました' });
    }
  };

  const handleTagToggle = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  if (!template) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit />
            <Typography variant="h6">定型文を編集</Typography>
          </Box>
          <Button onClick={handleClose} size="small">
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflow: 'auto' }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {/* 1. シーン */}
          <Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <FormControl sx={{ flex: 1, maxWidth: '60%' }}>
                <InputLabel>シーン</InputLabel>
                <Select
                  value={formData.sceneId || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sceneId: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  label="シーン"
                >
                  <MenuItem value="">
                    <em>未選択</em>
                  </MenuItem>
                  {scenes.map((scene) => (
                    <MenuItem key={scene.id} value={scene.id}>
                      {scene.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!showNewSceneForm && (
                <Button
                  size="medium"
                  startIcon={<AddCircle />}
                  onClick={() => setShowNewSceneForm(true)}
                  sx={{ mt: 1 }}
                >
                  新しいシーンを作成
                </Button>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                }
                label="公開"
                sx={{ mt: 1, ml: 2 }}
              />
            </Box>

            {showNewSceneForm && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <TextField
                  label="新しいシーン名"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  error={!!errors.scene}
                  helperText={errors.scene}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreateNewScene}
                    disabled={isCreatingScene}
                  >
                    {isCreatingScene ? '作成中...' : '作成'}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setShowNewSceneForm(false);
                      setNewSceneName('');
                      setErrors({});
                    }}
                  >
                    キャンセル
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* 2. コンテンツ */}
          <TextField
            label="コンテンツ"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            error={!!errors.content}
            helperText={errors.content}
            multiline
            rows={10}
            required
            fullWidth
            placeholder="定型文の内容を入力してください。変数は {{変数名}} の形式で記述できます。"
            InputProps={{
              style: { resize: 'vertical' }
            }}
          />


          {/* 4. タイトル */}
          <TextField
            label="タイトル（オプション）"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            error={!!errors.title}
            helperText={errors.title || "空の場合、コンテンツの最初の行が自動的にタイトルになります"}
            fullWidth
          />

          {/* 5. 説明 */}
          <TextField
            label="説明"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            error={!!errors.description}
            helperText={errors.description}
            multiline
            rows={2}
            fullWidth
            InputProps={{
              style: { resize: 'vertical' }
            }}
          />

          {/* 6. タグ */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1">
                タグ
              </Typography>
              {!showNewTagForm && (
                <Button
                  size="small"
                  startIcon={<AddCircle />}
                  onClick={() => setShowNewTagForm(true)}
                >
                  新しいタグを作成
                </Button>
              )}
            </Box>

            {showNewTagForm && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <TextField
                  label="新しいタグ名"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  error={!!errors.tag}
                  helperText={errors.tag}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="色"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  size="small"
                  sx={{ mb: 2, width: 120 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreateNewTag}
                    disabled={isCreatingTag}
                  >
                    {isCreatingTag ? '作成中...' : '作成'}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setShowNewTagForm(false);
                      setNewTagName('');
                      setNewTagColor('#1976d2');
                      setErrors({});
                    }}
                  >
                    キャンセル
                  </Button>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  onClick={() => handleTagToggle(tag.id)}
                  variant={formData.tagIds.includes(tag.id) ? 'filled' : 'outlined'}
                  sx={{
                    backgroundColor: formData.tagIds.includes(tag.id) && tag.color
                      ? tag.color
                      : undefined,
                    color: formData.tagIds.includes(tag.id) && tag.color
                      ? '#fff'
                      : undefined,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
        >
          {isLoading ? '更新中...' : '更新'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateEditModal;