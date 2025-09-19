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
  IconButton,
} from '@mui/material';
import { Search, Clear, Add, ExpandMore, ExpandLess, Label, Tune } from '@mui/icons-material';
import { useSearchTemplatesQuery, useDeleteTemplateMutation } from '../../store/api/templateApi';
import { useGetAllScenesQuery } from '../../store/api/sceneApi';
import { useGetAllTagsQuery } from '../../store/api/tagApi';
import { TemplateSearchFilters, Template } from '../../types';
import TemplateCard from './TemplateCard';
import TemplateEditModal from './TemplateEditModal';

interface TemplateSearchProps {
  onTemplateSelect?: (template: Template) => void;
  onCreateTemplate?: () => void;
  initialSceneId?: number;
  adminMode?: boolean;
}

const TemplateSearch: React.FC<TemplateSearchProps> = ({
  onTemplateSelect,
  onCreateTemplate,
  initialSceneId,
  adminMode = false,
}) => {
  const [filters, setFilters] = useState<TemplateSearchFilters>({
    keyword: '',
    sceneId: initialSceneId,
    tagIds: [],
    sortBy: 'updated',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    adminMode: adminMode,
  });

  // Update filters when initialSceneId changes
  React.useEffect(() => {
    setFilters(prev => ({ ...prev, sceneId: initialSceneId, page: 1 }));
  }, [initialSceneId]);

  // Update filters when adminMode changes
  React.useEffect(() => {
    setFilters(prev => ({ ...prev, adminMode: adminMode, page: 1 }));
  }, [adminMode]);

  // 編集モーダルの状態
  const [showEditModal, setShowEditModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<Template | null>(null);

  // 展開状態の管理
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const {
    data: templatesResponse,
    isLoading: templatesLoading,
    error: templatesError,
  } = useSearchTemplatesQuery(filters);

  const { data: scenesResponse } = useGetAllScenesQuery();
  const { data: tagsResponse } = useGetAllTagsQuery();
  const [deleteTemplate] = useDeleteTemplateMutation();

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

  const handleEditTemplate = (template: Template) => {
    setTemplateToEdit(template);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setTemplateToEdit(null);
  };

  const handleEditSuccess = () => {
    // テンプレートリストを再取得するため、filtersを更新
    setFilters(prev => ({ ...prev }));
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (window.confirm(`「${template.title}」を削除しますか？この操作は取り消せません。`)) {
      try {
        await deleteTemplate(template.id).unwrap();
        // テンプレートリストを再取得
        setFilters(prev => ({ ...prev }));
      } catch (error) {
        console.error('Template deletion failed:', error);
        alert('定型文の削除に失敗しました。');
      }
    }
  };

  const scenes = scenesResponse?.scenes || [];
  const tags = tagsResponse?.tags || [];
  const templates = templatesResponse?.data || [];
  const pagination = templatesResponse?.pagination;

  return (
    <Box id="template-search-container" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Header */}
      <Paper id="search-filters-header" sx={{ p: 0, mb: 2, boxShadow: 'none' }}>


        {/* Filters Row */}
        <Box sx={{ display: 'flex', gap: 1, mb: 0, flexWrap: 'wrap' }}>
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

          <IconButton
            size="small"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            title="検索・フィルター"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Tune />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleClearFilters}
            title="フィルタークリア"
          >
            <Clear />
          </IconButton>
        </Box>

        {/* Combined Search and Filter Section */}
        <Box sx={{ mb: 1 }}>

          {isFiltersExpanded && (
            <Box sx={{ mt: 0.5, pl: 0 }}>
              {/* Keyword Search */}
              <TextField
                fullWidth
                placeholder="キーワードで検索..."
                value={filters.keyword || ''}
                onChange={(e) => handleFilterChange({ keyword: e.target.value })}
                size="small"
                sx={{ mb: 1.5, mt: 2 }}
              />

              {/* Tag Filter */}
              {tags.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5, display: 'block' }}>
                    タグフィルター
                  </Typography>
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
                          fontSize: '0.7rem',
                          height: 24,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Results */}
      <Box id="search-results-container" sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
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
            <Box id="template-cards-list" sx={{ mb: 2 }}>
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => onTemplateSelect?.(template)}
                  onEdit={() => handleEditTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template)}
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

      {/* Template Edit Modal */}
      <TemplateEditModal
        open={showEditModal}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        template={templateToEdit}
      />
    </Box>
  );
};

export default TemplateSearch;