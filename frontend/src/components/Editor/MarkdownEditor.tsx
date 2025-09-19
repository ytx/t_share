import React, { useState, useCallback } from 'react';
import { Box, Paper, ToggleButton, ToggleButtonGroup, IconButton, Toolbar } from '@mui/material';
import { Edit, Visibility, VerticalSplit } from '@mui/icons-material';
import AceEditor from 'react-ace';
import ReactMarkdown from 'react-markdown';

// Import Ace Editor modes and themes
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  theme?: 'light' | 'dark';
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  readOnly?: boolean;
}

type ViewMode = 'edit' | 'preview' | 'split';

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'マークダウンで入力してください...',
  height = '400px',
  theme = 'light',
  showLineNumbers = true,
  wordWrap = true,
  fontSize = 14,
  readOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  const handleViewModeChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
      if (newMode !== null) {
        setViewMode(newMode);
      }
    },
    []
  );

  const aceTheme = theme === 'dark' ? 'monokai' : 'github';

  const editorOptions = {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    showLineNumbers,
    tabSize: 2,
    wrap: wordWrap,
    fontSize,
  };

  const renderEditor = () => (
    <AceEditor
      mode="markdown"
      theme={aceTheme}
      value={value}
      onChange={onChange}
      name="markdown-editor"
      width="100%"
      height={typeof height === 'number' ? `${height}px` : height}
      placeholder={placeholder}
      setOptions={editorOptions}
      readOnly={readOnly}
      style={{
        fontFamily: 'Monaco, "Courier New", monospace',
      }}
    />
  );

  const renderPreview = () => (
    <Box
      sx={{
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'auto',
        p: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          mt: 2,
          mb: 1,
        },
        '& p': {
          mb: 1,
        },
        '& ul, & ol': {
          pl: 3,
          mb: 1,
        },
        '& blockquote': {
          borderLeft: 4,
          borderColor: 'primary.main',
          pl: 2,
          ml: 0,
          fontStyle: 'italic',
          bgcolor: 'grey.50',
          py: 1,
        },
        '& code': {
          bgcolor: 'grey.100',
          p: 0.5,
          borderRadius: 0.5,
          fontFamily: 'Monaco, "Courier New", monospace',
        },
        '& pre': {
          bgcolor: 'grey.100',
          p: 2,
          borderRadius: 1,
          overflow: 'auto',
          '& code': {
            bgcolor: 'transparent',
            p: 0,
          },
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          mb: 2,
        },
        '& th, & td': {
          border: 1,
          borderColor: 'divider',
          p: 1,
          textAlign: 'left',
        },
        '& th': {
          bgcolor: 'grey.100',
          fontWeight: 'bold',
        },
      }}
    >
      {value ? (
        <ReactMarkdown>{value}</ReactMarkdown>
      ) : (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            fontStyle: 'italic',
          }}
        >
          プレビューを表示するにはマークダウンを入力してください
        </Box>
      )}
    </Box>
  );

  return (
    <Paper sx={{ height: 'fit-content' }}>
      {/* Toolbar */}
      <Toolbar variant="dense" sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box>
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="edit" aria-label="編集">
              <Edit sx={{ mr: 0.5 }} />
              編集
            </ToggleButton>
            <ToggleButton value="split" aria-label="分割">
              <VerticalSplit sx={{ mr: 0.5 }} />
              分割
            </ToggleButton>
            <ToggleButton value="preview" aria-label="プレビュー">
              <Visibility sx={{ mr: 0.5 }} />
              プレビュー
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Toolbar>

      {/* Editor Content */}
      <Box sx={{ p: 2 }}>
        {viewMode === 'edit' && renderEditor()}

        {viewMode === 'preview' && renderPreview()}

        {viewMode === 'split' && (
          <Box sx={{ display: 'flex', gap: 2, height }}>
            <Box sx={{ flex: 1 }}>
              {renderEditor()}
            </Box>
            <Box sx={{ flex: 1 }}>
              {renderPreview()}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MarkdownEditor;