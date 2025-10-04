import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Paper } from '@mui/material';
import ContextMenu from '../Common/ContextMenu';
import AceEditor from 'react-ace';

// Import Ace Editor modes and themes
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/ext-language_tools';

// Import keybindings
import 'ace-builds/src-noconflict/keybinding-vim';
import 'ace-builds/src-noconflict/keybinding-emacs';

// Import light themes
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/theme-xcode';
import 'ace-builds/src-noconflict/theme-katzenmilch';
import 'ace-builds/src-noconflict/theme-kuroir';

// Import dark themes
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/theme-twilight';
import 'ace-builds/src-noconflict/theme-vibrant_ink';
import 'ace-builds/src-noconflict/theme-cobalt';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/theme-tomorrow_night_blue';
import 'ace-builds/src-noconflict/theme-tomorrow_night_bright';
import 'ace-builds/src-noconflict/theme-tomorrow_night_eighties';
import 'ace-builds/src-noconflict/theme-idle_fingers';
import 'ace-builds/src-noconflict/theme-kr_theme';
import 'ace-builds/src-noconflict/theme-merbivore';
import 'ace-builds/src-noconflict/theme-merbivore_soft';
import 'ace-builds/src-noconflict/theme-mono_industrial';
import 'ace-builds/src-noconflict/theme-pastel_on_dark';
import 'ace-builds/src-noconflict/theme-solarized_dark';
import 'ace-builds/src-noconflict/theme-terminal';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  aceTheme?: string;
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  keybinding?: 'default' | 'vim' | 'emacs';
  showWhitespace?: boolean;
  readOnly?: boolean;
  onCreateTemplate?: (selectedText: string) => void;
  editorId?: string;
  onMoveToUpperEditor?: (selectedText: string) => void;
}

interface MarkdownEditorRef {
  getSelectedText: () => string;
  insertText: (text: string) => void;
}


const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({
  value,
  onChange,
  placeholder = 'マークダウンで入力してください...',
  aceTheme = 'github',
  showLineNumbers = true,
  wordWrap = true,
  fontSize = 14,
  keybinding = 'default',
  showWhitespace = false,
  readOnly = false,
  onCreateTemplate,
  editorId,
  onMoveToUpperEditor,
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

    // 選択テキストの有無に関わらず、コンテキストメニューを表示
    setContextMenu({
      position: {
        top: event.clientY,
        left: event.clientX,
      },
      selectedText: selectedText.trim(),
    });
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

  const handleMoveToUpperEditorFromContext = useCallback(() => {
    if (contextMenu.selectedText && onMoveToUpperEditor) {
      // Cut the selected text from this editor
      if (aceEditorRef.current) {
        const editor = aceEditorRef.current.editor;
        editor.session.replace(editor.selection.getRange(), '');
      }
      // Move to upper editor
      onMoveToUpperEditor(contextMenu.selectedText);
    }
    handleContextMenuClose();
  }, [contextMenu.selectedText, onMoveToUpperEditor, handleContextMenuClose]);

  const handleCut = useCallback(async () => {
    console.log('handleCut called', { hasEditor: !!aceEditorRef.current, selectedText: contextMenu.selectedText });

    if (!aceEditorRef.current) {
      console.error('Editor ref is null');
      return;
    }

    const editor = aceEditorRef.current.editor;
    const selectedText = editor.getSelectedText();

    console.log('Cutting text:', selectedText);

    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        editor.session.replace(editor.selection.getRange(), '');
        console.log('Cut successful');
      } catch (error) {
        console.error('切り取りに失敗しました:', error);
      }
    }
  }, [contextMenu.selectedText]);

  const handlePaste = useCallback(async () => {
    console.log('handlePaste called', { hasEditor: !!aceEditorRef.current });

    if (!aceEditorRef.current) {
      console.error('Editor ref is null');
      return;
    }

    const editor = aceEditorRef.current.editor;

    try {
      const text = await navigator.clipboard.readText();
      console.log('Pasting text:', text);
      if (text) {
        editor.session.replace(editor.selection.getRange(), text);
        console.log('Paste successful');
      }
    } catch (error) {
      console.error('ペーストに失敗しました:', error);
    }
  }, []);

  const editorOptions = {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: process.env.NODE_ENV === 'development',
    showLineNumbers,
    tabSize: 2,
    wrap: wordWrap,
    fontSize,
    showInvisibles: showWhitespace,
    scrollPastEnd: true,
    vScrollBarAlwaysVisible: true,
    hScrollBarAlwaysVisible: false,
  };

  // デバッグ用: ACEテーマを監視
  React.useEffect(() => {
    console.log('MarkdownEditor: ACE theme changed to:', aceTheme);
  }, [aceTheme]);

  const renderEditor = () => (
    <Box onContextMenu={handleContextMenu} sx={{ height: '100%' }}>
      <AceEditor
        ref={aceEditorRef}
        mode="markdown"
        theme={aceTheme}
        value={value}
        onChange={onChange}
        name={editorId || "markdown-editor"}
        width="100%"
        height="100%"
        placeholder={placeholder}
        setOptions={editorOptions}
        readOnly={readOnly}
        style={{
          fontFamily: 'Monaco, "Courier New", monospace',
        }}
        keyboardHandler={keybinding !== 'default' ? keybinding : undefined}
      />
    </Box>
  );


  return (
    <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Editor Content */}
      <Box sx={{ p: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {renderEditor()}
      </Box>

      {/* Context Menu */}
      <ContextMenu
        anchorPosition={contextMenu.position}
        onClose={handleContextMenuClose}
        onCreateTemplate={handleCreateTemplateFromContext}
        selectedText={contextMenu.selectedText}
        onCut={handleCut}
        onPaste={handlePaste}
        onMoveToUpperEditor={onMoveToUpperEditor ? handleMoveToUpperEditorFromContext : undefined}
      />
    </Paper>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;