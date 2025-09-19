import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import { Search, Clear, Add } from '@mui/icons-material';
import { useSearchTemplatesQuery } from '../../store/api/templateApi';
import { useGetAllScenesQuery } from '../../store/api/sceneApi';
import { useGetAllTagsQuery } from '../../store/api/tagApi';
import { TemplateSearchFilters, Template } from '../../types';
import TemplateCard from './TemplateCard';

interface TemplateSearchProps {
  onTemplateSelect?: (template: Template) => void;
  onCreateTemplate?: () => void;
}

const TemplateSearch: React.FC<TemplateSearchProps> = ({
  onTemplateSelect,
  onCreateTemplate,
}) => {
  const [filters, setFilters] = useState<TemplateSearchFilters>({
    keyword: '',
    sceneId: undefined,
    status: 'active',
    tagIds: [],
    sortBy: 'updated',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });

  const {
    data: templatesResponse,
    isLoading: templatesLoading,
    error: templatesError,
  } = useSearchTemplatesQuery(filters);

  const { data: scenesResponse } = useGetAllScenesQuery();
  const { data: tagsResponse } = useGetAllTagsQuery();

  const handleFilterChange = useCallback((newFilters: Partial<TemplateSearchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleClearFilters = () => {
    setFilters({
      keyword: '',
      sceneId: undefined,
      status: 'active',
      tagIds: [],
      sortBy: 'updated',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });
  };

  const handleTagToggle = (tagId: number) => {
    const currentTagIds = filters.tagIds || [];
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter(id => id !== tagId)
      : [...currentTagIds, tagId];

    handleFilterChange({ tagIds: newTagIds });
  };

  const scenes = scenesResponse?.scenes || [];
  const tags = tagsResponse?.tags || [];
  const templates = templatesResponse?.data || [];
  const pagination = templatesResponse?.pagination;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">定型文検索</Typography>
          {onCreateTemplate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onCreateTemplate}
              size="small"
            >
              新規作成
            </Button>
          )}
        </Box>

        {/* Search Input */}
        <TextField
          fullWidth
          placeholder="キーワードで検索..."
          value={filters.keyword || ''}
          onChange={(e) => handleFilterChange({ keyword: e.target.value })}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ mb: 2 }}
        />

        {/* Filters Row */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {/* Scene Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>シーン</InputLabel>
            <Select
              value={filters.sceneId || ''}
              label="シーン"
              onChange={(e) => handleFilterChange({ sceneId: e.target.value as number || undefined })}
            >
              <MenuItem value="">全て</MenuItem>
              {scenes.map(scene => (
                <MenuItem key={scene.id} value={scene.id}>
                  {scene.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>状態</InputLabel>
            <Select
              value={filters.status || 'active'}
              label="状態"
              onChange={(e) => handleFilterChange({ status: e.target.value as 'active' | 'all' })}
            >
              <MenuItem value="active">アクティブ</MenuItem>
              <MenuItem value="all">全て</MenuItem>
            </Select>
          </FormControl>

          {/* Sort Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>並び順</InputLabel>
            <Select
              value={filters.sortBy || 'updated'}
              label="並び順"
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
            >
              <MenuItem value="updated">更新日時</MenuItem>
              <MenuItem value="created">作成日時</MenuItem>
              <MenuItem value="lastUsed">利用日時</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Clear />}
            onClick={handleClearFilters}
          >
            クリア
          </Button>
        </Box>

        {/* Tag Filter */}
        {tags.length > 0 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>タグフィルター:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags.slice(0, 10).map(tag => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  clickable
                  color={filters.tagIds?.includes(tag.id) ? 'primary' : 'default'}
                  onClick={() => handleTagToggle(tag.id)}
                  sx={{
                    bgcolor: filters.tagIds?.includes(tag.id) ? undefined : tag.color + '20',
                    borderColor: tag.color,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Results */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {templatesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : templatesError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            検索中にエラーが発生しました
          </Alert>
        ) : templates.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              条件に一致する定型文が見つかりませんでした
            </Typography>
          </Paper>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => onTemplateSelect?.(template)}
                />
              ))}
            </Box>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default TemplateSearch;