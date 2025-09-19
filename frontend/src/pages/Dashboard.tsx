import React, { useState, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, Button, Menu, Avatar, Divider, Switch, FormControlLabel, Tooltip } from '@mui/material';
import { Settings, AdminPanelSettings, AccountCircle, Logout, Menu as MenuIcon, SupervisorAccount } from '@mui/icons-material';
import ThemeToggleButton from '../components/Common/ThemeToggleButton';
import '../styles/splitpane.css';
import SplitPane from 'react-split-pane';
import TemplateSearch from '../components/Templates/TemplateSearch';
import DocumentEditor from '../components/Editor/DocumentEditor';
import TemplateCreateModal from '../components/Templates/TemplateCreateModal';
import { Template } from '../types';
import { useUseTemplateMutation } from '../store/api/templateApi';
import { useGetAllScenesQuery } from '../store/api/sceneApi';
import { useGetAllProjectsQuery } from '../store/api/projectApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../components/Settings/SettingsModal';

const Dashboard: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [splitSize, setSplitSize] = useState('40%');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<number | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

  // Header state
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const [useTemplate] = useUseTemplateMutation();
  const { data: scenesResponse } = useGetAllScenesQuery();
  const { data: projectsResponse } = useGetAllProjectsQuery();

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleCreateTemplate = () => {
    setCreateModalOpen(true);
  };

  const handleUseTemplate = useCallback(async (templateId: number) => {
    try {
      await useTemplate(templateId).unwrap();
      console.log('Template usage recorded');
    } catch (error) {
      console.error('Failed to record template usage:', error);
    }
  }, [useTemplate]);

  const handleTemplateProcessed = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  const handleSaveDocument = (data: {
    title?: string;
    content: string;
    contentMarkdown: string;
    projectId?: number;
  }) => {
    console.log('Save document:', data);
    // This will be implemented in Phase 3.3
    alert('文書保存機能は Phase 3.3 で実装予定です');
  };

  // Header handlers
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleAdminDashboard = () => {
    navigate('/admin');
    handleClose();
  };

  const handleSettings = () => {
    setSettingsOpen(true);
    handleClose();
  };

  const toggleAdminMode = () => {
    setAdminMode(!adminMode);
  };

  const scenes = scenesResponse?.scenes || [];
  const projects = projectsResponse?.data || [];

  return (
    <Box id="dashboard-container" sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <AppBar position="fixed" elevation={1}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div">
            T-Share
          </Typography>

          {/* Project and Scene Selection */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2, ml: 2 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: 'inherit' }}>プロジェクト</InputLabel>
              <Select
                value={selectedProjectId || ''}
                label="プロジェクト"
                onChange={(e) => setSelectedProjectId(e.target.value as number || undefined)}
                sx={{
                  color: 'inherit',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'inherit',
                  }
                }}
              >
                <MenuItem value="">プロジェクトなし</MenuItem>
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: 'inherit' }}>シーン選択</InputLabel>
              <Select
                value={selectedSceneId || ''}
                label="シーン選択"
                onChange={(e) => setSelectedSceneId(e.target.value as number || undefined)}
                sx={{
                  color: 'inherit',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'inherit',
                  }
                }}
              >
                <MenuItem value="">全てのシーン</MenuItem>
                {scenes.map(scene => (
                  <MenuItem key={scene.id} value={scene.id}>
                    {scene.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Navigation buttons */}
          <IconButton color="inherit" onClick={() => setSettingsOpen(true)} sx={{ mr: 1 }}>
            <Settings />
          </IconButton>

          <ThemeToggleButton size="medium" />

          {user?.isAdmin && (
            <IconButton color="inherit" onClick={handleAdminDashboard} sx={{ mr: 1 }}>
              <AdminPanelSettings />
            </IconButton>
          )}

          {isAuthenticated ? (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {user?.displayName ? (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {user?.displayName || user?.email}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  ログアウト
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" href="/login">
                ログイン
              </Button>
              <Button color="inherit" variant="outlined" href="/register">
                登録
              </Button>
            </Box>
          )}

          {user?.isAdmin && (
            <Tooltip title={adminMode ? "全ての定型文を表示中" : "公開・自分の定型文のみ表示中"}>
              <FormControlLabel
                control={
                  <Switch
                    checked={adminMode}
                    onChange={toggleAdminMode}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase': {
                        color: 'white',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'white',
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  />
                }
                label=""
                sx={{
                  m: 0,
                  ml: 1,
                }}
              />
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box id="main-content" component="main" sx={{ flexGrow: 1, overflow: 'hidden', mt: '64px' }}>
        <Box id="content-wrapper" sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box id="split-pane-container" sx={{ flexGrow: 1, minHeight: 0 }}>
          <SplitPane
            split="vertical"
            minSize={300}
            maxSize={800}
            defaultSize={splitSize}
            onChange={(size) => setSplitSize(typeof size === 'string' ? size : `${size}px`)}
            style={{ height: 'calc(100vh - 64px)' }}
            paneStyle={{ overflow: 'hidden' }}
            resizerStyle={{
              background: '#ddd',
              width: '8px',
              cursor: 'col-resize',
              border: '1px solid #ccc',
              borderRadius: '4px',
              position: 'relative',
              transition: 'background-color 0.2s ease',
              opacity: 1,
            }}
          >
            {/* Left Panel - Template Search */}
            <Box id="left-panel-search" sx={{ height: '100%', p: 2, bgcolor: 'background.default', overflow: 'hidden' }}>
              <TemplateSearch
                onTemplateSelect={handleTemplateSelect}
                onCreateTemplate={handleCreateTemplate}
                initialSceneId={selectedSceneId}
                adminMode={user?.isAdmin ? adminMode : false}
              />
            </Box>

            {/* Right Panel - Document Editor */}
            <Box sx={{ height: '100%', p: 2, bgcolor: 'background.paper', overflow: 'hidden' }}>
              <DocumentEditor
                selectedTemplate={selectedTemplate}
                onSaveDocument={handleSaveDocument}
                onUseTemplate={handleUseTemplate}
                onTemplateProcessed={handleTemplateProcessed}
                selectedProjectId={selectedProjectId}
                selectedSceneId={selectedSceneId}
              />
            </Box>
          </SplitPane>
          </Box>
        </Box>
      </Box>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <TemplateCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          // Refresh template list would be handled by RTK Query cache invalidation
          console.log('定型文が正常に作成されました');
        }}
        initialSceneId={selectedSceneId}
      />
    </Box>
  );
};


export default Dashboard;