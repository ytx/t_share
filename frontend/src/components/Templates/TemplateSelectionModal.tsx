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
  Divider,
} from '@mui/material';
import { Search, Description as TemplateIcon } from '@mui/icons-material';
import { useSearchTemplatesQuery } from '../../store/api/templateApi';
import { Template, TemplateSearchFilters } from '../../types';

interface TemplateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
  title?: string;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  open,
  onClose,
  onSelect,
  title = 'テンプレートを選択',
}) => {
  const [searchFilters, setSearchFilters] = useState<TemplateSearchFilters>({
    keyword: '',
    status: 'active',
    limit: 50,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

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
    setSelectedTemplate(template);
  };

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
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
        <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
          {/* 検索・リストエリア */}
          <Box sx={{ flex: 1 }}>
            {/* 検索バー */}
            <TextField
              fullWidth
              placeholder="テンプレートを検索..."
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

            {/* テンプレートリスト */}
            <Box sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">
                  テンプレートの読み込み中にエラーが発生しました
                </Alert>
              ) : templates.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    条件に一致するテンプレートが見つかりませんでした
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {templates.map(template => (
                    <ListItem key={template.id} disablePadding>
                      <ListItemButton
                        selected={selectedTemplate?.id === template.id}
                        onClick={() => handleTemplateClick(template)}
                        sx={{
                          border: 1,
                          borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" noWrap>
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
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {template.description || template.content.substring(0, 100) + '...'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                {template.templateTags?.slice(0, 3).map(({ tag }) => (
                                  <Chip
                                    key={tag.id}
                                    label={tag.name}
                                    size="small"
                                    sx={{
                                      bgcolor: tag.color + '20',
                                      color: tag.color,
                                      fontSize: '0.65rem',
                                      height: 20,
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {selectedTemplate && (
            <>
              <Divider orientation="vertical" flexItem />

              {/* プレビューエリア */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  プレビュー
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {selectedTemplate.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    作成者: {selectedTemplate.creator?.displayName || selectedTemplate.creator?.username}
                  </Typography>
                  {selectedTemplate.description && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {selectedTemplate.description}
                    </Typography>
                  )}
                </Box>

                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    height: '300px',
                    overflow: 'auto',
                    bgcolor: 'grey.50',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedTemplate.content}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          キャンセル
        </Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedTemplate}
        >
          選択
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSelectionModal;