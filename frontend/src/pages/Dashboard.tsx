import React, { useState, useCallback, useRef } from 'react';
import { Box, AppBar, Toolbar, Typography, MenuItem, IconButton, Button, Menu, Avatar, Divider, Switch, FormControlLabel, Tooltip, Tabs, Tab } from '@mui/material';
import { Settings, AdminPanelSettings, AccountCircle, Logout, Menu as MenuIcon, Refresh } from '@mui/icons-material';
import ThemeToggleButton from '../components/Common/ThemeToggleButton';
import '../styles/splitpane.css';
import SplitPane from 'react-split-pane';
import TemplateSearch from '../components/Templates/TemplateSearch';
import DocumentEditor from '../components/Editor/DocumentEditor';
import SimpleMarkdownEditor, { SimpleMarkdownEditorRef } from '../components/Editor/SimpleMarkdownEditor';
import ProjectEditor, { ProjectEditorRef } from '../components/Editor/ProjectEditor';
import TemplateCreateModal from '../components/Templates/TemplateCreateModal';
import { Template, Document } from '../types';
import { useUseTemplateMutation, templateApi } from '../store/api/templateApi';
import { useGetAllProjectsQuery, projectApi } from '../store/api/projectApi';
import { useSearchDocumentsQuery, useGetProjectDocumentsQuery, documentApi } from '../store/api/documentApi';
import { sceneApi } from '../store/api/sceneApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import SettingsModal from '../components/Settings/SettingsModal';
import DocumentViewerModal from '../components/Documents/DocumentViewerModal';
import { getFromLocalStorage, saveProjectSelection, saveAdminMode, saveLowerEditorTab } from '../utils/localStorage';

const Dashboard: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [splitSize, setSplitSize] = useState('40%');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Initialize from localStorage
  const storedData = getFromLocalStorage();
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(storedData.selectedProjectId);

  // Header state
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(storedData.adminMode || false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentToOpen, setDocumentToOpen] = useState<Document | null>(null);
  const [lowerEditorTab, setLowerEditorTab] = useState(storedData.lowerEditorTab ?? 0); // 0: プロジェクト, 1: メモ
  const projectEditorRef = useRef<ProjectEditorRef>(null);
  const memoEditorRef = useRef<SimpleMarkdownEditorRef>(null);
  const documentEditorRef = useRef<any>(null);

  const [useTemplate] = useUseTemplateMutation();
  const { data: projectsResponse } = useGetAllProjectsQuery({});
  const { data: documentsResponse } = useSearchDocumentsQuery({ limit: 100 });
  const { data: projectDocumentsResponse } = useGetProjectDocumentsQuery(
    selectedProjectId!,
    { skip: !selectedProjectId }
  );

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = useCallback(async (templateId: number) => {
    try {
      await useTemplate(templateId).unwrap();
    } catch (error) {
      console.error('Failed to record template usage:', error);
    }
  }, [useTemplate]);

  const handleTemplateProcessed = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  const handleSaveDocument = (_data: {
    title?: string;
    content: string;
    contentMarkdown: string;
    projectId?: number;
  }) => {
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


  const toggleAdminMode = () => {
    const newAdminMode = !adminMode;
    setAdminMode(newAdminMode);
    saveAdminMode(newAdminMode);
  };

  const handleRefresh = () => {
    // Invalidate all relevant caches to force refetch from server
    dispatch(projectApi.util.invalidateTags(['Project']));
    dispatch(sceneApi.util.invalidateTags(['Scene']));
    dispatch(templateApi.util.invalidateTags(['Template']));
    dispatch(documentApi.util.invalidateTags(['Document']));
  };

  const handleOpenDocumentViewer = () => {
    setDocumentViewerOpen(true);
  };

  const handleOpenDocument = (document: Document) => {
    // This function handles opening a document in the editor
    setDocumentToOpen(document);
    setDocumentViewerOpen(false);

    // documentToOpenは一度使用されたらクリアする
    setTimeout(() => {
      setDocumentToOpen(null);
    }, 100);
  };

  const handleMoveToUpperEditor = useCallback((text: string) => {
    // Insert text into the upper editor (DocumentEditor)
    console.log('Dashboard: handleMoveToUpperEditor called with text:', text);
    if (documentEditorRef.current?.insertText) {
      documentEditorRef.current.insertText(text);
      console.log('Dashboard: Text inserted successfully');
    } else {
      console.error('Dashboard: documentEditorRef.current.insertText is not available');
    }
  }, []);

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
          <Tooltip title="データを再取得">
            <IconButton color="inherit" onClick={handleRefresh} sx={{ mr: 1 }}>
              <Refresh />
            </IconButton>
          </Tooltip>

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
                adminMode={user?.isAdmin ? adminMode : false}
              />
            </Box>

            {/* Right Panel - Vertical Split */}
            <SplitPane
              split="horizontal"
              minSize={200}
              maxSize={-200}
              defaultSize="60%"
              onChange={(size) => setSplitSize(typeof size === 'string' ? size : `${size}px`)}
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
                    ref={documentEditorRef}
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

              {/* Lower Panel - Tabbed Editors */}
              <Box sx={{ height: '100%', bgcolor: 'background.default', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Tab Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={lowerEditorTab} onChange={async (_e, newValue) => {
                    // Save before switching tabs
                    if (lowerEditorTab === 0 && projectEditorRef.current) {
                      await projectEditorRef.current.flush();
                    } else if (lowerEditorTab === 1 && memoEditorRef.current) {
                      await memoEditorRef.current.flush();
                    }
                    setLowerEditorTab(newValue);
                    saveLowerEditorTab(newValue);
                  }}>
                    <Tab label="プロジェクト内共有" disabled={!selectedProjectId} />
                    <Tab label="メモ（自分用）" />
                  </Tabs>
                </Box>

                {/* Tab Content */}
                <Box sx={{ flex: 1, overflow: 'hidden', p: 2, position: 'relative' }}>
                  <Box sx={{
                    height: '100%',
                    display: lowerEditorTab === 0 ? 'block' : 'none'
                  }}>
                    <ProjectEditor
                      ref={projectEditorRef}
                      selectedProjectId={selectedProjectId}
                      onMoveToUpperEditor={handleMoveToUpperEditor}
                    />
                  </Box>
                  <Box sx={{
                    height: '100%',
                    display: lowerEditorTab === 1 ? 'block' : 'none'
                  }}>
                    <SimpleMarkdownEditor
                      ref={memoEditorRef}
                      selectedProjectId={selectedProjectId}
                      onMoveToUpperEditor={handleMoveToUpperEditor}
                    />
                  </Box>
                </Box>
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