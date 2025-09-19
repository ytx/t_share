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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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

  return (
    <Card
      sx={{
        mb: 1,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          bgcolor: 'action.hover',
        } : {},
        border: 1,
        borderColor: 'divider',
      }}
      onClick={onClick}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h3" sx={{ mb: 0.5 }} noWrap>
              {template.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                {template.creator?.displayName?.charAt(0) || template.creator?.username?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="body2" color="text.secondary" noWrap>
                {template.creator?.displayName || template.creator?.username || '不明'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(template.updatedAt)}
              </Typography>
            </Box>
          </Box>

          {showActions && (
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ ml: 1 }}
            >
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Description */}
        {template.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {template.description}
          </Typography>
        )}

        {/* Content Preview */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            bgcolor: 'grey.50',
            p: 1,
            borderRadius: 1,
          }}
        >
          {template.content}
        </Typography>

        {/* Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {/* Scene Chip */}
            {template.scene && (
              <Chip
                label={template.scene.name}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}

            {/* Status Chip */}
            <Chip
              label={template.status === 'published' ? '公開' : '下書き'}
              size="small"
              color={template.status === 'published' ? 'success' : 'default'}
              variant="outlined"
            />

            {/* Tag Chips */}
            {template.templateTags?.slice(0, 3).map(({ tag }) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  bgcolor: tag.color + '20',
                  color: tag.color,
                  border: `1px solid ${tag.color}40`,
                }}
              />
            ))}

            {template.templateTags?.length > 3 && (
              <Chip
                label={`+${template.templateTags.length - 3}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Usage Info */}
          {usageInfo && (
            <Typography variant="caption" color="text.secondary">
              {usageInfo.count}回利用 • {usageInfo.lastUsed}
            </Typography>
          )}
        </Box>

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
      </CardContent>
    </Card>
  );
};

export default TemplateCard;