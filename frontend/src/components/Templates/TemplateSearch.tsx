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
import { Search, Clear, Add, ExpandMore, ExpandLess, LocalOffer, Tune, History } from '@mui/icons-material';
import { useSearchTemplatesQuery, useDeleteTemplateMutation } from '../../store/api/templateApi';
import { useGetAllScenesQuery } from '../../store/api/sceneApi';
import { useGetAllTagsQuery } from '../../store/api/tagApi';
import { TemplateSearchFilters, Template } from '../../types';
import { getFromLocalStorage, saveSearchFilters } from '../../utils/localStorage';
import TemplateCard from './TemplateCard';
import TemplateEditModal from './TemplateEditModal';

interface TemplateSearchProps {
  onTemplateSelect?: (template: Template) => void;
  onCreateTemplate?: () => void;
  adminMode?: boolean;
}

const TemplateSearch: React.FC<TemplateSearchProps> = ({
  onTemplateSelect,
  onCreateTemplate,
  adminMode = false,
}) => {
  // Initialize with empty values, restore later
  const [filters, setFilters] = useState<TemplateSearchFilters>({
    keyword: '',
    sceneId: undefined,
    tagIds: [],
    excludedTagIds: [],
    sortBy: 'updated',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    adminMode: adminMode,
  });

  // 初回マウントかどうかを判別するRef
  const isInitialMount = React.useRef(true);
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = React.useState(false);

  // ヘッダーが復元された後、少し待ってから検索フィルターを復元
  React.useEffect(() => {
    if (!hasRestoredFromStorage) {
      const timer = setTimeout(() => {
        const storedData = getFromLocalStorage();
        setFilters(prev => ({
          ...prev,
          keyword: storedData.searchFilters?.keyword || '',
          sceneId: storedData.searchFilters?.sceneId,
          tagIds: storedData.searchFilters?.tagFilter || [],
          excludedTagIds: storedData.searchFilters?.excludedTagFilter || [],
          sortBy: storedData.searchFilters?.sortBy || 'updated',
        }));
        setHasRestoredFromStorage(true);
      }, 100); // 100ms後に復元

      return () => clearTimeout(timer);
    }
  }, [hasRestoredFromStorage]);


  // Update filters when adminMode changes
  React.useEffect(() => {
    setFilters(prev => ({ ...prev, adminMode: adminMode, page: 1 }));
  }, [adminMode]);

  // 編集モーダルの状態
  const [showEditModal, setShowEditModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<Template | null>(null);
  const [showKeywordSearch, setShowKeywordSearch] = useState(false);
  const [showTagSearch, setShowTagSearch] = useState(false);


  const {
    data: templatesResponse,
    isLoading: templatesLoading,
    error: templatesError,
  } = useSearchTemplatesQuery(filters);

  const { data: scenesResponse } = useGetAllScenesQuery();
  const { data: tagsResponse } = useGetAllTagsQuery();
  const [deleteTemplate] = useDeleteTemplateMutation();

  const handleFilterChange = useCallback((newFilters: Partial<TemplateSearchFilters>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    };
    setFilters(updatedFilters);

    // Save to localStorage
    saveSearchFilters({
      sceneId: updatedFilters.sceneId,
      sortBy: updatedFilters.sortBy,
      keyword: updatedFilters.keyword,
      tagFilter: updatedFilters.tagIds,
      excludedTagFilter: updatedFilters.excludedTagIds,
    });
  }, [filters]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleClearFilters = () => {
    setFilters({
      keyword: '',
      sceneId: undefined,
      tagIds: [],
      excludedTagIds: [],
      sortBy: 'updated',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });
  };

  const handleTagToggle = (tagId: number) => {
    const currentTagIds = filters.tagIds || [];
    const currentExcludedTagIds = filters.excludedTagIds || [];

    // 現在の状態を確認
    const isIncluded = currentTagIds.includes(tagId);
    const isExcluded = currentExcludedTagIds.includes(tagId);

    let newTagIds = [...currentTagIds];
    let newExcludedTagIds = [...currentExcludedTagIds];

    if (!isIncluded && !isExcluded) {
      // 未使用 → 含む
      newTagIds.push(tagId);
    } else if (isIncluded && !isExcluded) {
      // 含む → 除外
      newTagIds = newTagIds.filter(id => id !== tagId);
      newExcludedTagIds.push(tagId);
    } else if (!isIncluded && isExcluded) {
      // 除外 → 未使用
      newExcludedTagIds = newExcludedTagIds.filter(id => id !== tagId);
    }

    handleFilterChange({ tagIds: newTagIds, excludedTagIds: newExcludedTagIds });
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
        <Box sx={{ display: 'flex', gap: 1, mb: 0, alignItems: 'center', width: '100%' }}>
          {/* Keyword Search Button */}
          <IconButton
            size="small"
            onClick={() => setShowKeywordSearch(!showKeywordSearch)}
            title="キーワード検索"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
              bgcolor: filters.keyword ? 'action.selected' : 'transparent',
            }}
          >
            <Search />
          </IconButton>

          {/* Scene Filter */}
          <FormControl size="small" sx={{ flex: 1, maxWidth: 400 }}>
            <InputLabel>シーン</InputLabel>
            <Select
              value={scenes.length > 0 && filters.sceneId && scenes.some(s => s.id === filters.sceneId) ? filters.sceneId : ''}
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

          {/* Tag Search Button */}
          <IconButton
            size="small"
            onClick={() => setShowTagSearch(!showTagSearch)}
            title="タグ検索"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <LocalOffer />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleClearFilters}
            title="フィルタークリア"
          >
            <Clear />
          </IconButton>
        </Box>

      </Paper>

      {/* Keyword Search Section */}
      {showKeywordSearch && (
        <Box sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="キーワードで検索..."
              value={filters.keyword || ''}
              onChange={(e) => handleFilterChange({ keyword: e.target.value })}
              autoFocus
              size="small"
              sx={{ flexGrow: 1 }}
            />
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
          </Box>
        </Box>
      )}

      {/* Tag Search Section */}
      {showTagSearch && (
        <Box sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {tags.length > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                タグをクリックして検索条件を設定してください（青：含む、赤：除外）
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map(tag => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    clickable
                    color={filters.tagIds?.includes(tag.id) ? 'primary' : filters.excludedTagIds?.includes(tag.id) ? 'error' : 'default'}
                    onClick={() => handleTagToggle(tag.id)}
                    sx={{
                      bgcolor: filters.tagIds?.includes(tag.id)
                        ? undefined
                        : filters.excludedTagIds?.includes(tag.id)
                          ? '#ffebee'
                          : tag.color + '20',
                      borderColor: filters.excludedTagIds?.includes(tag.id)
                        ? '#f44336'
                        : tag.color,
                      textDecoration: filters.excludedTagIds?.includes(tag.id) ? 'line-through' : 'none',
                      '& .MuiChip-label': {
                        textDecoration: filters.excludedTagIds?.includes(tag.id) ? 'line-through' : 'none',
                      },
                      '&.MuiChip-colorError': {
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              タグがありません
            </Typography>
          )}
        </Box>
      )}

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