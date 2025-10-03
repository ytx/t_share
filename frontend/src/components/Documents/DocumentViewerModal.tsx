import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Search,
  Close,
  Launch,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Document } from '../../types';

interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;
  documents: Document[];
  onOpenDocument: (document: Document) => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  open,
  onClose,
  documents,
  onOpenDocument,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // フィルタリングされた文書リストを更新
  useEffect(() => {
    // 特殊な文書を除外
    const specialTitles = ['プロジェクト内共有', 'メモ（自分用）'];
    const regularDocuments = documents.filter(doc => !specialTitles.includes(doc.title || ''));

    if (!searchKeyword.trim()) {
      setFilteredDocuments(regularDocuments);
    } else {
      const keyword = searchKeyword.toLowerCase();
      const filtered = regularDocuments.filter(doc =>
        doc.title?.toLowerCase().includes(keyword) ||
        doc.content.toLowerCase().includes(keyword) ||
        doc.response?.toLowerCase().includes(keyword)
      );
      setFilteredDocuments(filtered);
    }
    setCurrentIndex(0);
  }, [documents, searchKeyword]);

  // 検索実行
  const handleSearch = () => {
    setSearchKeyword(searchInput);
  };

  // Enterキーで検索
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const currentDocument = filteredDocuments[currentIndex];

  // ナビゲーション関数
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : filteredDocuments.length - 1);
  }, [filteredDocuments.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => prev < filteredDocuments.length - 1 ? prev + 1 : 0);
  }, [filteredDocuments.length]);

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        // スクロール処理（プレビューエリア内）
        if (contentRef.current) {
          contentRef.current.scrollBy(0, -50);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        // スクロール処理（プレビューエリア内）
        if (contentRef.current) {
          contentRef.current.scrollBy(0, 50);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [open, goToPrevious, goToNext, onClose, contentRef]);

  // キーボードイベントリスナーの設定
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, handleKeyDown]);

  // 文書を開く
  const handleOpenDocument = () => {
    if (currentDocument) {
      onOpenDocument(currentDocument);
      onClose();
    }
  };

  // モーダル閉じる時に検索をリセット
  const handleClose = () => {
    setSearchKeyword('');
    setSearchInput('');
    setCurrentIndex(0);
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">保存された文書</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          {/* 検索ボックス */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="キーワードで検索..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{ minWidth: '80px' }}
            >
              検索
            </Button>
          </Box>

          {/* ナビゲーション */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="前の文書 (←)">
                <IconButton
                  onClick={goToPrevious}
                  disabled={filteredDocuments.length <= 1}
                  size="small"
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>

              <Typography variant="body2" sx={{ mx: 2 }}>
                {filteredDocuments.length > 0 ? `${currentIndex + 1} / ${filteredDocuments.length}` : '0 / 0'}
              </Typography>

              <Tooltip title="次の文書 (→)">
                <IconButton
                  onClick={goToNext}
                  disabled={filteredDocuments.length <= 1}
                  size="small"
                >
                  <ArrowForward />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                ↑↓でスクロール, ←→で文書切替, Escで閉じる
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 文書内容表示エリア */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, minHeight: 0 }}>
          {filteredDocuments.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <Typography variant="body1" color="text.secondary">
                {documents.length === 0 ? '保存された文書がありません' : '検索条件に一致する文書がありません'}
              </Typography>
            </Box>
          ) : currentDocument ? (
            <>
              {/* 文書タイトル */}
              <Box sx={{ flexShrink: 0, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {currentDocument.title || '無題の文書'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  作成日: {new Date(currentDocument.createdAt).toLocaleString('ja-JP')}
                  {currentDocument.creator && ` | 作成者: ${currentDocument.creator.displayName || currentDocument.creator.username || '不明'}`}
                  {currentDocument.project && ` | プロジェクト: ${currentDocument.project.name}`}
                </Typography>
              </Box>

              {/* 文書内容 */}
              <Paper
                variant="outlined"
                ref={contentRef}
                sx={{
                  flex: 1,
                  p: 2,
                  overflow: 'auto',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  color: (theme) => theme.palette.mode === 'dark' ? 'grey.100' : 'inherit',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  minHeight: 0,
                  maxHeight: '100%',
                }}
              >
                {/* プロンプト部分 */}
                <Box sx={{ mb: currentDocument.response ? 3 : 0 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {currentDocument.response ? 'プロンプト:' : ''}
                  </Typography>
                  <Box sx={{
                    '& ul': { pl: 4, listStyleType: 'disc' },
                    '& ol': { pl: 4, listStyleType: 'decimal' },
                    '& li': { mb: 0.5 },
                    '& ul ul': { listStyleType: 'circle' },
                    '& ul ul ul': { listStyleType: 'square' },
                    '& hr': { my: 2, border: 'none', borderTop: '1px solid', borderColor: 'divider' },
                    '& p': { mb: 1 },
                    '& pre': { p: 1, bgcolor: 'action.hover', borderRadius: 1, overflow: 'auto' },
                    '& code': { fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 },
                  }}>
                    <ReactMarkdown>{currentDocument.content || '（内容なし）'}</ReactMarkdown>
                  </Box>
                </Box>

                {/* 返答部分（存在する場合のみ） */}
                {currentDocument.response && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      返答:
                    </Typography>
                    <Box sx={{
                      '& ul': { pl: 4, listStyleType: 'disc' },
                      '& ol': { pl: 4, listStyleType: 'decimal' },
                      '& li': { mb: 0.5 },
                      '& ul ul': { listStyleType: 'circle' },
                      '& ul ul ul': { listStyleType: 'square' },
                      '& hr': { my: 2, border: 'none', borderTop: '1px solid', borderColor: 'divider' },
                      '& p': { mb: 1 },
                      '& pre': { p: 1, bgcolor: 'action.hover', borderRadius: 1, overflow: 'auto' },
                      '& code': { fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 },
                    }}>
                      <ReactMarkdown>{currentDocument.response}</ReactMarkdown>
                    </Box>
                  </Box>
                )}
              </Paper>
            </>
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          閉じる
        </Button>
        <Button
          onClick={handleOpenDocument}
          variant="contained"
          startIcon={<Launch />}
          disabled={!currentDocument}
        >
          開く
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentViewerModal;