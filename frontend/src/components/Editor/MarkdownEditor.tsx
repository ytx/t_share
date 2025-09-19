import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import ContextMenu from '../Common/ContextMenu';
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
  onCreateTemplate?: (selectedText: string) => void;
}

interface MarkdownEditorRef {
  getSelectedText: () => string;
  insertText: (text: string) => void;
}


const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({
  value,
  onChange,
  placeholder = 'マークダウンで入力してください...',
  height = '400px',
  theme = 'light',
  showLineNumbers = true,
  wordWrap = true,
  fontSize = 14,
  readOnly = false,
  onCreateTemplate,
}, ref) => {
  const [contextMenu, setContextMenu] = useState<{
    position: { top: number; left: number } | null;
    selectedText: string;
  }>({
    position: null,
    selectedText: '',
  });

  const aceEditorRef = useRef<any>(null);

  // 選択テキストを取得する関数
  const getSelectedText = useCallback(() => {
    let selectedText = '';

    // Ace Editorのセッション経由で選択テキストを取得
    if (aceEditorRef.current && aceEditorRef.current.editor) {
      const editor = aceEditorRef.current.editor;
      const session = editor.getSession();
      const selection = editor.getSelection();

      if (!selection.isEmpty()) {
        selectedText = session.getTextRange(selection.getRange());
      }
    }

    // フォールバック: 通常のwindow.getSelection()
    if (!selectedText.trim()) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selectedText = selection.toString();
      }
    }

    return selectedText;
  }, []);

  // テキストを挿入する関数
  const insertText = useCallback((text: string) => {
    if (aceEditorRef.current && aceEditorRef.current.editor) {
      const editor = aceEditorRef.current.editor;
      const session = editor.getSession();
      const selection = editor.getSelection();

      if (!selection.isEmpty()) {
        // 選択部分がある場合は置き換え
        session.replace(selection.getRange(), text);
      } else {
        // 選択部分がない場合はカーソル位置に挿入
        const cursor = editor.getCursorPosition();
        session.insert(cursor, text);
      }

      // フォーカスを戻す
      editor.focus();
    }
  }, []);

  // 外部からアクセス可能な関数を公開
  useImperativeHandle(ref, () => ({
    getSelectedText,
    insertText,
  }), [getSelectedText, insertText]);


  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();

    const selectedText = getSelectedText();

    console.log('Context menu - Selected text:', {
      length: selectedText.length,
      lines: selectedText.split('\n').length,
      text: selectedText
    });

    if (selectedText.trim()) {
      setContextMenu({
        position: {
          top: event.clientY,
          left: event.clientX,
        },
        selectedText: selectedText.trim(),
      });
    }
  }, [getSelectedText]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({
      position: null,
      selectedText: '',
    });
  }, []);

  const handleCreateTemplateFromContext = useCallback(() => {
    if (contextMenu.selectedText && onCreateTemplate) {
      onCreateTemplate(contextMenu.selectedText);
    }
    handleContextMenuClose();
  }, [contextMenu.selectedText, onCreateTemplate, handleContextMenuClose]);

  const aceTheme = theme === 'dark' ? 'monokai' : 'github';

  const editorOptions = {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    showLineNumbers,
    tabSize: 2,
    wrap: wordWrap,
    fontSize,
    scrollPastEnd: 0.5,
    vScrollBarAlwaysVisible: true,
    hScrollBarAlwaysVisible: false,
  };

  const renderEditor = () => (
    <Box onContextMenu={handleContextMenu}>
      <AceEditor
        ref={aceEditorRef}
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
    </Box>
  );


  return (
    <Paper sx={{ height: typeof height === 'number' ? `${height + 32}px` : `calc(${height} + 32px)`, overflow: 'hidden' }}>
      {/* Editor Content */}
      <Box sx={{ p: 2, height: '100%', overflow: 'hidden' }}>
        {renderEditor()}
      </Box>

      {/* Context Menu */}
      <ContextMenu
        anchorPosition={contextMenu.position}
        onClose={handleContextMenuClose}
        onCreateTemplate={handleCreateTemplateFromContext}
        selectedText={contextMenu.selectedText}
      />
    </Paper>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;