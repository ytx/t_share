import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Visibility,
  ContentCopy,
  History,
} from '@mui/icons-material';
import { Template } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TemplateCardProps {
  template: Template;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onCopy?: () => void;
  onShowHistory?: () => void;
  showActions?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  onEdit,
  onDelete,
  onView,
  onCopy,
  onShowHistory,
  showActions = false,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onEdit) {
      setContextMenu({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
      });
    }
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleEditFromContext = () => {
    if (onEdit) {
      onEdit();
    }
    handleContextMenuClose();
  };

  const handleDeleteFromContext = () => {
    if (onDelete) {
      onDelete();
    }
    handleContextMenuClose();
  };

  const handleMenuAction = (action: () => void) => {
    return () => {
      action();
      handleMenuClose();
    };
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ja,
      });
    } catch {
      return dateString;
    }
  };

  const getUsageInfo = () => {
    if (template.templateUsage && template.templateUsage.length > 0) {
      const usage = template.templateUsage[0];
      return {
        count: usage.usageCount,
        lastUsed: formatDate(usage.lastUsedAt),
      };
    }
    return null;
  };

  const usageInfo = getUsageInfo();

  const formatLastUsed = (date: string | Date | null | undefined) => {
    if (!date) return '未使用';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTooltipDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
            {template.title}
          </Typography>
          {template.scene && (
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              シーン: {template.scene.name}
            </Typography>
          )}
          {template.description && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {template.description}
            </Typography>
          )}
          <Typography variant="caption" display="block">
            作成者: {template.creator?.displayName || template.creator?.username || '不明'}
          </Typography>
          <Typography variant="caption" display="block">
            更新時間: {formatTooltipDate(template.updatedAt)}
          </Typography>
          <Typography variant="caption" display="block">
            状態: {template.status === 'published' ? '公開' : '下書き'}
          </Typography>
          <Typography variant="caption" display="block">
            利用回数: {usageInfo?.count || 0}回
          </Typography>
          <Typography variant="caption" display="block">
            最終利用: {formatLastUsed(usageInfo?.lastUsed)}
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
      <Card
        id={`template-card-${template.id}`}
        sx={{
          mb: 1,
          cursor: onClick ? 'pointer' : 'default',
          bgcolor: 'background.paper',
          '&:hover': onClick ? {
            bgcolor: 'action.hover',
            borderColor: 'primary.main',
          } : {},
          border: 1,
          borderColor: 'divider',
        }}
        onClick={onClick}
        onContextMenu={handleRightClick}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Header with actions only */}
          {showActions && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <IconButton
                size="small"
                onClick={handleMenuClick}
              >
                <MoreVert />
              </IconButton>
            </Box>
          )}

          {/* Full Content */}
          <Typography
            id={`template-content-${template.id}`}
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              bgcolor: !template.isPublic
                ? (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 99, 71, 0.1)'
                  : 'rgba(255, 99, 71, 0.05)'
                : (theme) => theme.palette.mode === 'dark'
                  ? 'background.default'
                  : 'grey.50',
              color: 'text.primary',
              p: '2px 5px 2px 2px',
              borderRadius: 0.5,
              border: 1,
              borderColor: (theme) => theme.palette.mode === 'dark'
                ? 'divider'
                : 'grey.200',
              mb: 0,
              '& p': {
                m: 0,
                p: 0,
              },
            }}
          >
            {template.content}
          </Typography>


          {/* Action Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
          >
            {onView && (
              <MenuItem onClick={handleMenuAction(onView)}>
                <Visibility sx={{ mr: 1 }} />
                表示
              </MenuItem>
            )}
            {onCopy && (
              <MenuItem onClick={handleMenuAction(onCopy)}>
                <ContentCopy sx={{ mr: 1 }} />
                コピー
              </MenuItem>
            )}
            {onEdit && (
              <MenuItem onClick={handleMenuAction(onEdit)}>
                <Edit sx={{ mr: 1 }} />
                編集
              </MenuItem>
            )}
            {onShowHistory && (
              <MenuItem onClick={handleMenuAction(onShowHistory)}>
                <History sx={{ mr: 1 }} />
                履歴
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem onClick={handleMenuAction(onDelete)} sx={{ color: 'error.main' }}>
                <Delete sx={{ mr: 1 }} />
                削除
              </MenuItem>
            )}
          </Menu>

          {/* Right-click Context Menu */}
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
            <MenuItem onClick={handleEditFromContext}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <Typography>編集</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDeleteFromContext} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              <Typography>削除</Typography>
            </MenuItem>
          </Menu>
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default TemplateCard;