import React, { memo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  Group,
  Description,
  Folder,
} from '@mui/icons-material';
import { useGetSystemStatsQuery } from '../../store/api/adminApi';

const SystemOverview: React.FC = memo(() => {
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
        システム統計の読み込み中にエラーが発生しました
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const StatCard = memo(({ icon, title, value, subtitle, color = 'primary' }: any) => (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color: `${color}.main`, mr: 2 }}>{icon}</Box>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="h4" color={`${color}.main`} gutterBottom>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  ));
  StatCard.displayName = 'StatCard';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        システム概要
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Group />}
            title="ユーザー"
            value={stats.overview.totalUsers}
            subtitle={`新規登録（今日）: ${stats.userActivity.newUsersToday}`}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Description />}
            title="テンプレート"
            value={stats.overview.totalTemplates}
            subtitle={`作成（今日）: ${stats.templateActivity.templatesCreatedToday}`}
            color="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Folder />}
            title="プロジェクト"
            value={stats.overview.totalProjects}
            subtitle={`作成（今日）: ${stats.projectActivity.projectsCreatedToday}`}
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUp />}
            title="文書"
            value={stats.overview.totalDocuments}
            subtitle={`作成（今日）: ${stats.projectActivity.documentsCreatedToday}`}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Activity Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ユーザーアクティビティ
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                新規ユーザー（月間）
              </Typography>
              <Typography variant="h5">
                {stats.userActivity.newUsersMonth}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.userActivity.newUsersMonth / stats.overview.totalUsers) * 100}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                新規ユーザー（週間）
              </Typography>
              <Typography variant="h5">
                {stats.userActivity.newUsersWeek}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.userActivity.newUsersWeek / stats.userActivity.newUsersMonth || 1) * 100}
                sx={{ mt: 1 }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              テンプレートアクティビティ
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                テンプレート使用（月間）
              </Typography>
              <Typography variant="h5">
                {stats.templateActivity.templateUsageMonth}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((stats.templateActivity.templateUsageMonth / 1000) * 100, 100)}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                テンプレート作成（月間）
              </Typography>
              <Typography variant="h5">
                {stats.templateActivity.templatesCreatedMonth}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.templateActivity.templatesCreatedMonth / stats.overview.totalTemplates) * 100}
                sx={{ mt: 1 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Popular Templates */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          人気テンプレート
        </Typography>

        {stats.templateActivity.popularTemplates.length === 0 ? (
          <Typography color="text.secondary">
            まだ使用されたテンプレートがありません
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>テンプレート名</TableCell>
                  <TableCell>作成者</TableCell>
                  <TableCell align="right">使用回数</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.templateActivity.popularTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.title}</TableCell>
                    <TableCell>{template.creator}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={template.usageCount}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* System Health */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          システム状態
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                メモリ使用量
              </Typography>
              <Typography variant="h6">
                {stats.systemHealth.memoryUsage}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                稼働時間
              </Typography>
              <Typography variant="h6">
                {stats.systemHealth.uptime}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                DB接続数
              </Typography>
              <Typography variant="h6">
                {stats.systemHealth.databaseConnections}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                エラー（24h）
              </Typography>
              <Typography variant="h6" color={stats.systemHealth.errorCount24h > 0 ? 'error.main' : 'success.main'}>
                {stats.systemHealth.errorCount24h}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
});
SystemOverview.displayName = 'SystemOverview';

export default SystemOverview;