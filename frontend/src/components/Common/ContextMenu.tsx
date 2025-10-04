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
  ArrowUpward,
} from '@mui/icons-material';

interface ContextMenuProps {
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  onCreateTemplate?: () => void;
  selectedText?: string;
  onCut?: () => void;
  onPaste?: () => void;
  onMoveToUpperEditor?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  anchorPosition,
  onClose,
  onCreateTemplate,
  selectedText,
  onCut,
  onPaste,
  onMoveToUpperEditor,
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

  const handleCutClick = () => {
    handleClose();
    if (onCut) {
      // 非同期で実行して、メニューが先に閉じるようにする
      setTimeout(() => onCut(), 0);
    }
  };

  const handlePasteClick = () => {
    handleClose();
    if (onPaste) {
      // 非同期で実行して、メニューが先に閉じるようにする
      setTimeout(() => onPaste(), 0);
    }
  };

  const handleMoveToUpperEditorClick = () => {
    handleClose();
    if (onMoveToUpperEditor) {
      // 非同期で実行して、メニューが先に閉じるようにする
      setTimeout(() => onMoveToUpperEditor(), 0);
    }
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
      <MenuItem onClick={handleCreateTemplate} disabled={!selectedText}>
        <ListItemIcon>
          <Add fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="定型文を作成" />
      </MenuItem>
      <Divider />

      <MenuItem onClick={handleCopy} disabled={!selectedText}>
        <ListItemIcon>
          <ContentCopy fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="コピー" />
      </MenuItem>

      <MenuItem onClick={handleCutClick} disabled={!selectedText}>
        <ListItemIcon>
          <ContentCut fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="切り取り" />
      </MenuItem>

      <MenuItem onClick={handlePasteClick}>
        <ListItemIcon>
          <ContentPaste fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="ペースト" />
      </MenuItem>

      {onMoveToUpperEditor && (
        <>
          <Divider />
          <MenuItem onClick={handleMoveToUpperEditorClick} disabled={!selectedText}>
            <ListItemIcon>
              <ArrowUpward fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="上のエディタへ移動" />
          </MenuItem>
        </>
      )}
    </Menu>
  );
};

export default ContextMenu;