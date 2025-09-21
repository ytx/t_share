import React, { useState, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, Button, Menu, Avatar, Divider, Switch, FormControlLabel, Tooltip } from '@mui/material';
import { Settings, AdminPanelSettings, AccountCircle, Logout, Menu as MenuIcon, SupervisorAccount, History } from '@mui/icons-material';
import ThemeToggleButton from '../components/Common/ThemeToggleButton';
import '../styles/splitpane.css';
import SplitPane from 'react-split-pane';
import TemplateSearch from '../components/Templates/TemplateSearch';
import DocumentEditor from '../components/Editor/DocumentEditor';
import SimpleMarkdownEditor from '../components/Editor/SimpleMarkdownEditor';
import TemplateCreateModal from '../components/Templates/TemplateCreateModal';
import { Template } from '../types';
import { useUseTemplateMutation } from '../store/api/templateApi';
import { useGetAllProjectsQuery } from '../store/api/projectApi';
import { useSearchDocumentsQuery, useGetProjectDocumentsQuery } from '../store/api/documentApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../components/Settings/SettingsModal';
import DocumentViewerModal from '../components/Documents/DocumentViewerModal';
import { getFromLocalStorage, saveProjectSelection, saveAdminMode } from '../utils/localStorage';

const Dashboard: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [splitSize, setSplitSize] = useState('40%');
  const [verticalSplitSize, setVerticalSplitSize] = useState('60%');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Initialize from localStorage
  const storedData = getFromLocalStorage();
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(storedData.selectedProjectId);

  // Header state
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(storedData.adminMode || false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentToOpen, setDocumentToOpen] = useState<any>(null);

  const [useTemplate] = useUseTemplateMutation();
  const { data: projectsResponse } = useGetAllProjectsQuery();
  const { data: documentsResponse } = useSearchDocumentsQuery({ limit: 100 });
  const { data: projectDocumentsResponse } = useGetProjectDocumentsQuery(
    selectedProjectId!,
    { skip: !selectedProjectId }
  );

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
    const newAdminMode = !adminMode;
    setAdminMode(newAdminMode);
    saveAdminMode(newAdminMode);
  };

  const handleOpenDocumentViewer = () => {
    setDocumentViewerOpen(true);
  };

  const handleOpenDocument = (document: any) => {
    // This function handles opening a document in the editor
    console.log('Opening document:', document);
    setDocumentToOpen(document);
    setDocumentViewerOpen(false);

    // documentToOpenは一度使用されたらクリアする
    setTimeout(() => {
      setDocumentToOpen(null);
    }, 100);
  };

  const projects = projectsResponse?.data || [];
  const documents = documentsResponse?.data || [];

  // プロジェクトが選択されている場合は、そのプロジェクトの文書のみを表示
  const displayDocuments = selectedProjectId
    ? (projectDocumentsResponse?.data || [])
    : documents;

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
            T-SHARE
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Navigation buttons */}
          <IconButton color="inherit" onClick={() => setSettingsOpen(true)} sx={{ mr: 1 }}>
            <Settings />
          </IconButton>

          <ThemeToggleButton size="medium" />

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
            <>
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
              <IconButton color="inherit" onClick={handleAdminDashboard} sx={{ ml: 1 }}>
                <AdminPanelSettings />
              </IconButton>
            </>
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
            paneStyle={{ overflow: 'hidden', margin: 0 }}
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
                adminMode={user?.isAdmin ? adminMode : false}
              />
            </Box>

            {/* Right Panel - Vertical Split */}
            <SplitPane
              split="horizontal"
              minSize={200}
              maxSize={-200}
              defaultSize="60%"
              onChange={(size) => setVerticalSplitSize(typeof size === 'string' ? size : `${size}px`)}
              style={{ height: '100%' }}
              paneStyle={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: 0 }}
              resizerStyle={{
                background: '#ddd',
                height: '8px',
                width: '100%',
                cursor: 'row-resize',
                border: '1px solid #ccc',
                borderRadius: '4px',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                opacity: 1,
                zIndex: 1,
                boxSizing: 'border-box',
                userSelect: 'none',
                outline: 'none',
              }}
            >
              {/* Upper Panel - Document Editor */}
              <Box sx={{ height: '100%', p: 2, bgcolor: 'background.paper', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <DocumentEditor
                    selectedTemplate={selectedTemplate}
                    onSaveDocument={handleSaveDocument}
                    onUseTemplate={handleUseTemplate}
                    onTemplateProcessed={handleTemplateProcessed}
                    selectedProjectId={selectedProjectId}
                    projects={projects}
                    onProjectChange={(projectId) => {
                      setSelectedProjectId(projectId);
                      saveProjectSelection(projectId);
                    }}
                    onOpenDocumentViewer={handleOpenDocumentViewer}
                    documentToOpen={documentToOpen}
                  />
                </Box>
              </Box>

              {/* Lower Panel - Simple ACE Editor */}
              <Box sx={{ height: '100%', p: 2, bgcolor: 'background.default', overflow: 'hidden' }}>
                <SimpleMarkdownEditor
                  selectedProjectId={selectedProjectId}
                />
              </Box>
            </SplitPane>
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
      />

      <DocumentViewerModal
        open={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
        documents={displayDocuments}
        onOpenDocument={handleOpenDocument}
      />
    </Box>
  );
};


export default Dashboard;