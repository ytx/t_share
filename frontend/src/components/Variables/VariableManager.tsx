import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Upload,
  Download,
} from '@mui/icons-material';
import UserVariablesList from './UserVariablesList';
import ProjectVariablesList from './ProjectVariablesList';
import VariableCreateModal from './VariableCreateModal';
import VariableBulkImportModal from './VariableBulkImportModal';

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
      id={`variable-tabpanel-${index}`}
      aria-labelledby={`variable-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `variable-tab-${index}`,
    'aria-controls': `variable-tabpanel-${index}`,
  };
}

interface VariableManagerProps {
  selectedProjectId?: number;
}

const VariableManager: React.FC<VariableManagerProps> = ({
  selectedProjectId,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateVariable = () => {
    setShowCreateModal(true);
  };

  const handleBulkImport = () => {
    setShowBulkImportModal(true);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export variables');
  };

  const isUserTab = tabValue === 0;
  const isProjectTab = tabValue === 1;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            変数管理
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="変数をエクスポート">
              <IconButton onClick={handleExport} size="small">
                <Download />
              </IconButton>
            </Tooltip>

            <Tooltip title="変数を一括インポート">
              <IconButton onClick={handleBulkImport} size="small">
                <Upload />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateVariable}
              size="small"
            >
              変数を追加
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="variable tabs">
            <Tab label="ユーザ変数" {...a11yProps(0)} />
            <Tab
              label="プロジェクト変数"
              {...a11yProps(1)}
              disabled={!selectedProjectId}
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <UserVariablesList />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {selectedProjectId ? (
            <ProjectVariablesList projectId={selectedProjectId} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                プロジェクト変数を管理するには、プロジェクトを選択してください
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Description */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>変数の使い方:</strong><br />
            • ユーザ変数: 全てのテンプレートで使用可能<br />
            • プロジェクト変数: 指定されたプロジェクト内でのみ使用可能<br />
            • テンプレート内で {`{{変数名}}`} の形式で使用
          </Typography>
        </Box>
      </Paper>

      {/* Create Variable Modal */}
      <VariableCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        variableType={isUserTab ? 'user' : 'project'}
        projectId={isProjectTab ? selectedProjectId : undefined}
      />

      {/* Bulk Import Modal */}
      <VariableBulkImportModal
        open={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        variableType={isUserTab ? 'user' : 'project'}
        projectId={isProjectTab ? selectedProjectId : undefined}
      />
    </Box>
  );
};

export default VariableManager;