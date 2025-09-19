import React, { useState, memo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard,
  People,
  Assessment,
  Timeline,
  Download,
} from '@mui/icons-material';
import { useGetSystemStatsQuery } from '../../store/api/adminApi';
import SystemOverview from './SystemOverview';
import UserManagement from './UserManagement';
import ActivityMonitor from './ActivityMonitor';
import SystemHealth from './SystemHealth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminDashboard: React.FC = memo(() => {
  const [tabValue, setTabValue] = useState(0);

  const { data: systemStats, isLoading, error } = useGetSystemStatsQuery();

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        管理者ダッシュボードの読み込み中にエラーが発生しました
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Dashboard color="primary" />
          <Typography variant="h4" component="h1">
            管理者ダッシュボード
          </Typography>
        </Box>

        {systemStats && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    総ユーザー数
                  </Typography>
                  <Typography variant="h4">
                    {systemStats.overview.totalUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    総テンプレート数
                  </Typography>
                  <Typography variant="h4">
                    {systemStats.overview.totalTemplates}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    総プロジェクト数
                  </Typography>
                  <Typography variant="h4">
                    {systemStats.overview.totalProjects}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    総文書数
                  </Typography>
                  <Typography variant="h4">
                    {systemStats.overview.totalDocuments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab
              icon={<Assessment />}
              label="システム概要"
              {...a11yProps(0)}
            />
            <Tab
              icon={<People />}
              label="ユーザー管理"
              {...a11yProps(1)}
            />
            <Tab
              icon={<Timeline />}
              label="アクティビティ"
              {...a11yProps(2)}
            />
            <Tab
              icon={<Dashboard />}
              label="システム状態"
              {...a11yProps(3)}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <SystemOverview />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ActivityMonitor />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <SystemHealth />
        </TabPanel>
      </Paper>
    </Box>
  );
});
AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;