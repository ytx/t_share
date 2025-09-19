import React, { useState } from 'react';
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
import { Add, Close } from '@mui/icons-material';
import { useCreateTemplateMutation } from '../../store/api/templateApi';
import { useGetAllScenesQuery } from '../../store/api/sceneApi';
import { useGetAllTagsQuery } from '../../store/api/tagApi';
import { TemplateFormData } from '../../types';

interface TemplateCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TemplateCreateModal: React.FC<TemplateCreateModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    content: '',
    description: '',
    sceneId: undefined,
    status: 'draft',
    isPublic: true,
    tagIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createTemplate, { isLoading }] = useCreateTemplateMutation();
  const { data: scenesData } = useGetAllScenesQuery();
  const { data: tagsData } = useGetAllTagsQuery();

  const scenes = scenesData?.scenes || [];
  const tags = tagsData?.tags || [];

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      description: '',
      sceneId: undefined,
      status: 'draft',
      isPublic: true,
      tagIds: [],
    });
    setErrors({});
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (formData.title.length > 200) {
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createTemplate(formData).unwrap();
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Template creation failed:', error);
      setErrors({ submit: 'テンプレートの作成に失敗しました' });
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
            <Add />
            <Typography variant="h6">新しいテンプレートを作成</Typography>
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
          <TextField
            label="タイトル"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            error={!!errors.title}
            helperText={errors.title}
            required
            fullWidth
          />

          <TextField
            label="説明"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            error={!!errors.description}
            helperText={errors.description}
            multiline
            rows={2}
            fullWidth
          />

          <FormControl fullWidth>
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

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              タグ
            </Typography>
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
            placeholder="テンプレートの内容を入力してください。変数は {{変数名}} の形式で記述できます。"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  status: e.target.value as 'draft' | 'published'
                }))}
                label="ステータス"
              >
                <MenuItem value="draft">下書き</MenuItem>
                <MenuItem value="published">公開</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
              }
              label="公開テンプレート"
            />
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
          {isLoading ? '作成中...' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateCreateModal;