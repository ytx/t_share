import React, { memo, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Description,
  Folder,
  Article,
} from '@mui/icons-material';
import { useGetRecentActivityQuery } from '../../store/api/adminApi';

const ActivityMonitor: React.FC = memo(() => {
  const { data, isLoading, error } = useGetRecentActivityQuery({ limit: 50 });

  const getIcon = useCallback((type: string) => {
    switch (type) {
      case 'template':
        return <Description color="primary" />;
      case 'project':
        return <Folder color="secondary" />;
      case 'document':
        return <Article color="success" />;
      default:
        return <Description />;
    }
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'template':
        return 'テンプレート';
      case 'project':
        return 'プロジェクト';
      case 'document':
        return '文書';
      default:
        return type;
    }
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        アクティビティの読み込み中にエラーが発生しました
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        最近のアクティビティ
      </Typography>

      <Paper>
        <List>
          {data?.data.map((activity, index) => (
            <ListItem key={`${activity.type}-${activity.id}-${index}`}>
              <ListItemIcon>
                {getIcon(activity.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {activity.title}
                    </Typography>
                    <Chip
                      label={getTypeLabel(activity.type)}
                      size="small"
                      color={activity.type === 'template' ? 'primary' :
                             activity.type === 'project' ? 'secondary' : 'success'}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      作成者: {activity.creator}
                      {activity.project && ` • プロジェクト: ${activity.project}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.createdAt).toLocaleString('ja-JP')}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {data?.data.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              最近のアクティビティがありません
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
});
ActivityMonitor.displayName = 'ActivityMonitor';

export default ActivityMonitor;