import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import { Search, Description as TemplateIcon, Edit } from '@mui/icons-material';
import { useSearchTemplatesQuery } from '../../store/api/templateApi';
import { Template, TemplateSearchFilters } from '../../types';

interface TemplateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
  title?: string;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  open,
  onClose,
  onInsert,
  onEditTemplate,
  title = '定型文を選択',
}) => {
  const [searchFilters, setSearchFilters] = useState<TemplateSearchFilters>({
    keyword: '',
    status: 'active',
    limit: 50,
  });

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    template: Template | null;
  } | null>(null);

  const {
    data: templatesResponse,
    isLoading,
    error,
  } = useSearchTemplatesQuery(searchFilters);

  const templates = templatesResponse?.data || [];

  const handleSearchChange = (keyword: string) => {
    setSearchFilters(prev => ({
      ...prev,
      keyword,
      page: 1,
    }));
  };

  const handleTemplateClick = (template: Template) => {
    // Insert template content directly when clicked
    onInsert(template);
    onClose();
  };

  const handleTemplateRightClick = (event: React.MouseEvent, template: Template) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      template,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleEditTemplate = () => {
    if (contextMenu?.template && onEditTemplate) {
      onEditTemplate(contextMenu.template);
    }
    handleContextMenuClose();
    onClose();
  };

  const formatLastUsed = (date: string | Date | null | undefined) => {
    if (!date) return '未使用';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleClose = () => {
    setContextMenu(null);
    onClose();
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TemplateIcon />
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ height: '100%' }}>
          {/* 検索バー */}
          <TextField
            fullWidth
            placeholder="定型文を検索..."
            value={searchFilters.keyword || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* 定型文リスト */}
          <Box sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">
                定型文の読み込み中にエラーが発生しました
              </Alert>
            ) : templates.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  条件に一致する定型文が見つかりませんでした
                </Typography>
              </Box>
            ) : (
              <List dense>
                {templates.map(template => {
                  const usageCount = template.templateUsage?.[0]?.usageCount || 0;
                  const lastUsed = template.templateUsage?.[0]?.lastUsedAt;

                  return (
                    <ListItem key={template.id} disablePadding>
                      <Tooltip
                        title={
                          <Box>
                            {template.description && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {template.description}
                              </Typography>
                            )}
                            <Typography variant="caption" display="block">
                              利用回数: {usageCount}回
                            </Typography>
                            <Typography variant="caption" display="block">
                              最終利用: {formatLastUsed(lastUsed)}
                            </Typography>
                            {template.templateTags && template.templateTags.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block">
                                  タグ: {template.templateTags.map(({ tag }) => tag.name).join(', ')}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                        placement="right"
                        arrow
                      >
                        <ListItemButton
                          onClick={() => handleTemplateClick(template)}
                          onContextMenu={(e) => handleTemplateRightClick(e, template)}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': {
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {template.title}
                                  </Typography>
                                  {template.scene && (
                                    <Chip
                                      label={template.scene.name}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'monospace',
                                    bgcolor: 'grey.50',
                                    p: 1,
                                    borderRadius: 0.5,
                                    border: 1,
                                    borderColor: 'grey.200',
                                    maxHeight: '120px',
                                    overflow: 'auto',
                                  }}
                                >
                                  {template.content}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          閉じる
        </Button>
      </DialogActions>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleEditTemplate}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <Typography>定型文を編集</Typography>
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

export default TemplateSelectionModal;