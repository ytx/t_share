import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleButtonProps {
  size?: 'small' | 'medium' | 'large';
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ size = 'medium' }) => {
  const { mode, toggleMode } = useTheme();

  return (
    <Tooltip title={mode === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}>
      <IconButton
        onClick={toggleMode}
        color="inherit"
        size={size}
        sx={{ mr: 1 }}
      >
        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;