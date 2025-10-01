import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useImportJsonlMutation, useGetImportStatsQuery, useGetImportHistoryQuery } from '../../store/api/claudeHistoryApi';
import { useGetUserProjectsQuery } from '../../store/api/projectApi';

const ClaudeHistoryImport: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [importResults, setImportResults] = useState<Array<{
    fileName: string;
    success: boolean;
    result?: {
      imported: number;
      updated: number;
      skipped: number;
      errors: string[];
    };
    error?: string;
  }>>([]);

  const [importJsonl, { isLoading: isImporting }] = useImportJsonlMutation();
  const { data: statsResponse } = useGetImportStatsQuery();
  const { data: projectsResponse } = useGetUserProjectsQuery();
  const { data: historyResponse } = useGetImportHistoryQuery({
    projectId: selectedProjectId
  });

  const projects = projectsResponse?.data || [];
  const stats = statsResponse?.data;
  const history = historyResponse?.data || [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const jsonlFiles = files.filter(file => file.name.endsWith('.jsonl'));

    if (jsonlFiles.length < files.length) {
      alert('JSONLファイルのみ選択してください');
    }

    setSelectedFiles(jsonlFiles);
    setImportResults([]);
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      alert('ファイルを選択してください');
      return;
    }

    if (!selectedProjectId) {
      alert('プロジェクトを選択してください');
      return;
    }

    setImportResults([]);

    for (const file of selectedFiles) {
      try {
        const response = await importJsonl({
          file,
          projectId: selectedProjectId,
        }).unwrap();

        setImportResults(prev => [...prev, {
          fileName: file.name,
          success: true,
          result: response.result,
        }]);
      } catch (error) {
        setImportResults(prev => [...prev, {
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'インポートに失敗しました',
        }]);
      }
    }
  };

  const totalImported = importResults.reduce((sum, r) => sum + (r.result?.imported || 0), 0);
  const totalUpdated = importResults.reduce((sum, r) => sum + (r.result?.updated || 0), 0);
  const totalSkipped = importResults.reduce((sum, r) => sum + (r.result?.skipped || 0), 0);
  const totalErrors = importResults.reduce((sum, r) => sum + (r.result?.errors.length || 0), 0);

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Claude Code会話履歴インポート
      </Typography>

      {/* 使い方 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          <strong>使い方:</strong>
        </Typography>
        <Typography variant="body2" component="div">
          1. インポート先のプロジェクトを選択（必須）<br />
          2. ローカルの <code>~/.claude/projects/</code> フォルダから .jsonl ファイルを選択<br />
          3. 「インポート実行」ボタンをクリック
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>重複チェック:</strong> プロンプト内容とタイムスタンプ（±5分）で既存文書を照合します。
        </Typography>
      </Alert>

      {/* プロジェクト選択・ファイル選択・インポート実行 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          インポート設定
        </Typography>

        {/* プロジェクト選択 */}
        <FormControl fullWidth sx={{ mb: 2 }} required>
          <InputLabel>プロジェクト（必須）</InputLabel>
          <Select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
            label="プロジェクト（必須）"
          >
            <MenuItem value="">
              <em>選択してください</em>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ファイル選択 */}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          JSONLファイル選択
        </Typography>

        <input
          accept=".jsonl"
          style={{ display: 'none' }}
          id="jsonl-file-upload"
          type="file"
          multiple
          onChange={handleFileSelect}
        />
        <label htmlFor="jsonl-file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            fullWidth
            sx={{ mb: 2 }}
          >
            JSONLファイルを選択
          </Button>
        </label>

        {selectedFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              選択されたファイル: {selectedFiles.length}件
            </Typography>
            <List dense>
              {selectedFiles.map((file, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024).toFixed(1)} KB`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* インポートボタン */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleImport}
          disabled={selectedFiles.length === 0 || !selectedProjectId || isImporting}
          startIcon={isImporting ? <CircularProgress size={20} /> : <CloudUpload />}
          sx={{ mt: 2 }}
        >
          {isImporting ? 'インポート中...' : 'インポート実行'}
        </Button>
      </Paper>

      {/* 進捗表示 */}
      {isImporting && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            {importResults.length} / {selectedFiles.length} ファイル処理済み
          </Typography>
        </Box>
      )}

      {/* インポート結果 */}
      {importResults.length > 0 && !isImporting && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            インポート結果
          </Typography>

          {/* サマリー */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>新規インポート:</strong> {totalImported}件 |{' '}
              <strong>更新:</strong> {totalUpdated}件 |{' '}
              <strong>スキップ:</strong> {totalSkipped}件
              {totalErrors > 0 && (
                <>
                  {' | '}
                  <strong style={{ color: '#d32f2f' }}>エラー:</strong> {totalErrors}件
                </>
              )}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ファイル別結果 */}
          <List>
            {importResults.map((result, index) => (
              <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {result.success ? (
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    <strong>{result.fileName}</strong>
                  </Typography>
                </Box>

                {result.success && result.result && (
                  <Box sx={{ ml: 4, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      新規: {result.result.imported} | 更新: {result.result.updated} | スキップ: {result.result.skipped}
                    </Typography>
                    {result.result.errors.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="error">
                          エラー {result.result.errors.length}件:
                        </Typography>
                        {result.result.errors.slice(0, 3).map((err, i) => (
                          <Typography key={i} variant="caption" display="block" color="error">
                            • {err}
                          </Typography>
                        ))}
                        {result.result.errors.length > 3 && (
                          <Typography variant="caption" color="error">
                            ... 他 {result.result.errors.length - 3}件
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {!result.success && (
                  <Typography variant="caption" color="error" sx={{ ml: 4 }}>
                    {result.error}
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* インポート済み会話統計 */}
      {stats && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            インポート済み会話統計
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">総会話数</Typography>
              <Typography variant="h6">{stats.totalConversations}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">返答あり</Typography>
              <Typography variant="h6">{stats.withResponses}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">プロンプトのみ</Typography>
              <Typography variant="h6">{stats.withoutResponses}</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* インポート履歴 */}
      {history.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            インポート履歴
            {selectedProjectId && ` (${projects.find(p => p.id === selectedProjectId)?.name})`}
          </Typography>
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ファイル名</TableCell>
                  <TableCell align="right">サイズ</TableCell>
                  <TableCell align="right">新規</TableCell>
                  <TableCell align="right">更新</TableCell>
                  <TableCell align="right">スキップ</TableCell>
                  <TableCell align="right">エラー</TableCell>
                  <TableCell>インポート日時</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fileName}</TableCell>
                    <TableCell align="right">{(item.fileSize / 1024).toFixed(1)} KB</TableCell>
                    <TableCell align="right">{item.imported}</TableCell>
                    <TableCell align="right">{item.updated}</TableCell>
                    <TableCell align="right">{item.skipped}</TableCell>
                    <TableCell align="right">{item.errors}</TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default ClaudeHistoryImport;
