import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Logout,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SettingsModal from '../Settings/SettingsModal';
import ThemeToggleButton from '../Common/ThemeToggleButton';

interface MainLayoutProps {
  children: React.ReactNode;
  headerExtras?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, headerExtras }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppBar position="static" elevation={1}>
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

          {/* Header extras (project/scene selection) */}
          {headerExtras && (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {headerExtras}
            </Box>
          )}

          {!headerExtras && (
            <Box sx={{ flexGrow: 1 }} />
          )}

          {/* Navigation buttons */}
          <IconButton color="inherit" onClick={() => setSettingsOpen(true)} sx={{ mr: 1 }}>
            <Settings />
          </IconButton>

          {user?.isAdmin && (
            <IconButton color="inherit" onClick={handleAdminDashboard} sx={{ mr: 1 }}>
              <AdminPanelSettings />
            </IconButton>
          )}

          {/* Theme toggle */}
          <Box sx={{ mr: 1 }}>
            <ThemeToggleButton size="medium" />
          </Box>

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
                <MenuItem onClick={handleSettings}>
                  <Settings sx={{ mr: 1 }} />
                  設定
                </MenuItem>
                {user?.isAdmin && (
                  <MenuItem onClick={handleAdminDashboard}>
                    <AdminPanelSettings sx={{ mr: 1 }} />
                    管理者ダッシュボード
                  </MenuItem>
                )}
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
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {children}
      </Box>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  );
};

export default MainLayout;