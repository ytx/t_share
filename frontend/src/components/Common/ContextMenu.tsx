import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add,
  ContentCopy,
  ContentCut,
  ContentPaste,
} from '@mui/icons-material';

interface ContextMenuProps {
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  onCreateTemplate?: () => void;
  selectedText?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  anchorPosition,
  onClose,
  onCreateTemplate,
  selectedText,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(Boolean(anchorPosition));
  }, [anchorPosition]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleCreateTemplate = () => {
    if (onCreateTemplate) {
      onCreateTemplate();
    }
    handleClose();
  };

  const handleCopy = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
      } catch (error) {
        console.error('コピーに失敗しました:', error);
      }
    }
    handleClose();
  };

  const handleCut = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        // テキストの削除は親コンポーネントで処理する必要があります
      } catch (error) {
        console.error('切り取りに失敗しました:', error);
      }
    }
    handleClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // ペーストの処理は親コンポーネントで処理する必要があります
      console.log('Paste:', text);
    } catch (error) {
      console.error('ペーストに失敗しました:', error);
    }
    handleClose();
  };

  if (!anchorPosition) return null;

  return (
    <Menu
      open={open}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      MenuListProps={{
        dense: true,
      }}
    >
      {selectedText && (
        <>
          <MenuItem onClick={handleCreateTemplate}>
            <ListItemIcon>
              <Add fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="定型文を作成" />
          </MenuItem>
          <Divider />
        </>
      )}

      {selectedText && (
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="コピー" />
        </MenuItem>
      )}

      {selectedText && (
        <MenuItem onClick={handleCut}>
          <ListItemIcon>
            <ContentCut fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="切り取り" />
        </MenuItem>
      )}

      <MenuItem onClick={handlePaste}>
        <ListItemIcon>
          <ContentPaste fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="ペースト" />
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;