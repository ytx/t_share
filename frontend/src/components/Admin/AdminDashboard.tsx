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
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Dashboard,
  People,
  Assessment,
  Timeline,
  Download,
  ArrowBack,
  Label,
  Category,
  Work,
  Settings,
  ImportExport,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetSystemStatsQuery } from '../../store/api/adminApi';
import SystemOverview from './SystemOverview';
import UserManagement from './UserManagement';
import ActivityMonitor from './ActivityMonitor';
import SystemHealth from './SystemHealth';
import ProjectManagement from './ProjectManagement';
import TagManagement from './TagManagement';
import SceneManagement from './SceneManagement';
import DataManagementPanel from '../Settings/DataManagementPanel';

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
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
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
  const navigate = useNavigate();

  const { data: systemStats, isLoading, error } = useGetSystemStatsQuery();

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <AppBar position="fixed" elevation={1}>
        <Toolbar>
          <Tooltip title="メイン画面に戻る">
            <IconButton
              color="inherit"
              onClick={handleBackToDashboard}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            T-Share - 管理画面
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto', pt: '16px', px: 2, pb: 2 }}>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs" variant="scrollable" scrollButtons="auto">
            <Tab
              icon={<People />}
              label="ユーザー管理"
              {...a11yProps(0)}
            />
            <Tab
              icon={<Label />}
              label="タグ管理"
              {...a11yProps(1)}
            />
            <Tab
              icon={<Category />}
              label="シーン管理"
              {...a11yProps(2)}
            />
            <Tab
              icon={<Work />}
              label="プロジェクト管理"
              {...a11yProps(3)}
            />
            <Tab
              icon={<Settings />}
              label="設定管理"
              {...a11yProps(4)}
            />
            <Tab
              icon={<ImportExport />}
              label="データ管理"
              {...a11yProps(5)}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TagManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <SceneManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <ProjectManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              設定管理機能
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              システム設定のエクスポート・インポート機能を実装予定
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <DataManagementPanel />
        </TabPanel>
        </Paper>
      </Box>
    </Box>
  );
});
AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;