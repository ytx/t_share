import React, { memo, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Memory,
  AccessTime,
  Storage,
  Error,
} from '@mui/icons-material';
import { useGetSystemStatsQuery } from '../../store/api/adminApi';

const SystemHealth: React.FC = memo(() => {
  const { data: stats, isLoading, error } = useGetSystemStatsQuery();

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
        システム健康状態の読み込み中にエラーが発生しました
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const parseMemoryUsage = useCallback((memoryStr: string) => {
    const match = memoryStr.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }, []);

  const memoryUsagePercent = parseMemoryUsage(stats.systemHealth.memoryUsage);
  const errorCount = stats.systemHealth.errorCount24h;
  const dbConnections = stats.systemHealth.databaseConnections;

  const HealthCard = ({
    icon,
    title,
    value,
    status,
    description,
    color = 'primary'
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    status?: 'good' | 'warning' | 'error';
    description?: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 2 }}>{icon}</Box>
          <Typography variant="h6">{title}</Typography>
        </Box>

        <Typography variant="h4" color={`${color}.main`} gutterBottom>
          {value}
        </Typography>

        {status && (
          <Chip
            label={
              status === 'good' ? '正常' :
              status === 'warning' ? '注意' : 'エラー'
            }
            color={
              status === 'good' ? 'success' :
              status === 'warning' ? 'warning' : 'error'
            }
            size="small"
            sx={{ mb: 1 }}
          />
        )}

        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        システム健康状態
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <HealthCard
            icon={<Memory />}
            title="メモリ使用量"
            value={stats.systemHealth.memoryUsage}
            status={memoryUsagePercent > 80 ? 'error' : memoryUsagePercent > 60 ? 'warning' : 'good'}
            description="システムメモリ使用状況"
            color={memoryUsagePercent > 80 ? 'error' : memoryUsagePercent > 60 ? 'warning' : 'success'}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <HealthCard
            icon={<AccessTime />}
            title="稼働時間"
            value={stats.systemHealth.uptime}
            status="good"
            description="システム連続稼働時間"
            color="primary"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <HealthCard
            icon={<Storage />}
            title="DB接続数"
            value={dbConnections}
            status={dbConnections > 50 ? 'warning' : 'good'}
            description="アクティブなデータベース接続"
            color={dbConnections > 50 ? 'warning' : 'success'}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <HealthCard
            icon={<Error />}
            title="エラー（24時間）"
            value={errorCount}
            status={errorCount > 10 ? 'error' : errorCount > 0 ? 'warning' : 'good'}
            description="過去24時間のエラー数"
            color={errorCount > 10 ? 'error' : errorCount > 0 ? 'warning' : 'success'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              メモリ使用量詳細
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                現在の使用量: {stats.systemHealth.memoryUsage}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={memoryUsagePercent}
                sx={{
                  mt: 1,
                  height: 8,
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: memoryUsagePercent > 80 ? 'error.main' :
                                   memoryUsagePercent > 60 ? 'warning.main' : 'success.main'
                  }
                }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary">
              推奨: 60%以下を維持
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              システム状態サマリ
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  全体的な健康状態
                </Typography>
                <Chip
                  label={
                    errorCount > 10 || memoryUsagePercent > 80 ? '要注意' :
                    errorCount > 0 || memoryUsagePercent > 60 ? '良好' : '優良'
                  }
                  color={
                    errorCount > 10 || memoryUsagePercent > 80 ? 'error' :
                    errorCount > 0 || memoryUsagePercent > 60 ? 'warning' : 'success'
                  }
                  size="small"
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  パフォーマンス
                </Typography>
                <Chip
                  label={memoryUsagePercent < 60 && dbConnections < 30 ? '高速' : '標準'}
                  color={memoryUsagePercent < 60 && dbConnections < 30 ? 'success' : 'primary'}
                  size="small"
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  安定性
                </Typography>
                <Chip
                  label={errorCount === 0 ? '安定' : '不安定'}
                  color={errorCount === 0 ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {(errorCount > 10 || memoryUsagePercent > 80) && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>システム状態に注意が必要です:</strong>
            {memoryUsagePercent > 80 && ' メモリ使用量が高くなっています。'}
            {errorCount > 10 && ' エラー発生頻度が高くなっています。'}
            システム管理者に連絡することをお勧めします。
          </Typography>
        </Alert>
      )}
    </Box>
  );
});
SystemHealth.displayName = 'SystemHealth';

export default SystemHealth;