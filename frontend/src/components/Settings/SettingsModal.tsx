import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings,
  Close,
  Restore,
} from '@mui/icons-material';
import EditorSettingsPanel from './EditorSettingsPanel';
import ProjectManagement from './ProjectManagement';
import UserVariableManagement from './UserVariableManagement';
import ProjectVariableManagement from './ProjectVariableManagement';
import { useResetUserPreferencesMutation } from '../../store/api/userPreferenceApi';
import ConfirmDialog from '../Common/ConfirmDialog';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{
          p: 3,
          height: '100%',
          overflow: 'auto'
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const [resetPreferences, { isLoading: isResetting }] = useResetUserPreferencesMutation();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReset = async () => {
    try {
      await resetPreferences().unwrap();
      setShowResetDialog(false);
    } catch (error) {
      console.error('設定のリセットに失敗しました:', error);
    }
  };


  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings />
              <Typography variant="h6">設定</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="設定をリセット">
                <IconButton size="small" onClick={() => setShowResetDialog(true)}>
                  <Restore />
                </IconButton>
              </Tooltip>

              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="プロジェクト" {...a11yProps(0)} />
            <Tab label="プロジェクト変数" {...a11yProps(1)} />
            <Tab label="ユーザ変数" {...a11yProps(2)} />
            <Tab label="エディタ" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0, overflow: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
          <TabPanel value={tabValue} index={0}>
            <ProjectManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ProjectVariableManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <UserVariableManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <EditorSettingsPanel />
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleReset}
        title="設定をリセット"
        content="すべての設定をデフォルト値にリセットしますか？この操作は取り消せません。"
        confirmText="リセット"
        severity="warning"
        loading={isResetting}
      />
    </>
  );
};

export default SettingsModal;