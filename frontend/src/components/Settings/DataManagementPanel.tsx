import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  useGetExportStatsQuery,
  useImportAllDataMutation,
  useValidateImportDataMutation,
  downloadExportFile,
  readImportFile,
  type ExportData,
  type ImportOptions,
  type ImportCategories,
  type ValidationResult,
} from '../../store/api/dataExportImportApi';

const DataManagementPanel: React.FC = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    clearExistingData: false,
    preserveIds: true,
    categories: {
      users: true,
      scenesAndTemplates: true,
      projectsAndDocuments: true,
      systemSettings: true,
    },
  });
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: statsData, isLoading: statsLoading } = useGetExportStatsQuery();
  const [importAllData, { isLoading: importLoading }] = useImportAllDataMutation();
  const [validateImportData, { isLoading: validationLoading }] = useValidateImportDataMutation();

  // エクスポート処理
  const handleExport = async () => {
    setExportLoading(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const result = await downloadExportFile();
      setExportSuccess(`データをエクスポートしました: ${result.filename}`);
    } catch (error) {
      setExportError('データのエクスポートに失敗しました');
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // ファイル選択処理
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await readImportFile(file);
      setImportFile(file);
      setImportData(data);
      setValidation(null);
      setImportDialog(true);

      // データの検証を実行
      const validationResult = await validateImportData(data).unwrap();
      setValidation(validationResult.validation);
    } catch (error) {
      setExportError('ファイルの読み込みに失敗しました');
      console.error('File read failed:', error);
    }
  };

  // インポート処理
  const handleImport = async () => {
    if (!importData) return;

    try {
      await importAllData({
        ...importData,
        options: importOptions,
      }).unwrap();

      setImportDialog(false);
      setImportFile(null);
      setImportData(null);
      setValidation(null);
      setExportSuccess('データのインポートが完了しました');
    } catch (error) {
      setExportError('データのインポートに失敗しました');
      console.error('Import failed:', error);
    }
  };

  // インポートダイアログを閉じる
  const handleCloseImportDialog = () => {
    setImportDialog(false);
    setImportFile(null);
    setImportData(null);
    setValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        データ管理
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        システム全体のデータをエクスポート・インポートできます。開発環境やデータ移行時にご利用ください。
      </Typography>

      {/* エラー・成功メッセージ */}
      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      )}
      {exportSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setExportSuccess(null)}>
          {exportSuccess}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* エクスポート機能 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DownloadIcon sx={{ mr: 1 }} />
              <Typography variant="h6">データエクスポート</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              システム内の全データをJSON形式でダウンロードします。
            </Typography>

            {/* 統計情報 */}
            {statsLoading ? (
              <CircularProgress size={20} />
            ) : statsData ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  エクスポート対象データ:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  <Chip label={`ユーザー: ${statsData.stats.users}`} size="small" />
                  <Chip label={`定型文: ${statsData.stats.templates}`} size="small" />
                  <Chip label={`プロジェクト: ${statsData.stats.projects}`} size="small" />
                  <Chip label={`文書: ${statsData.stats.documents}`} size="small" />
                </Box>
              </Box>
            ) : null}

            <Button
              variant="contained"
              onClick={handleExport}
              disabled={exportLoading}
              startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
              fullWidth
            >
              {exportLoading ? 'エクスポート中...' : 'データをエクスポート'}
            </Button>
          </Paper>
        </Grid>

        {/* インポート機能 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <UploadIcon sx={{ mr: 1 }} />
              <Typography variant="h6">データインポート</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              エクスポートしたJSONファイルからデータを復元します。
            </Typography>

            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />

            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<UploadIcon />}
              fullWidth
            >
              インポートファイルを選択
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* インポートダイアログ */}
      <Dialog
        open={importDialog}
        onClose={handleCloseImportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>データインポート確認</DialogTitle>
        <DialogContent>
          {importFile && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">選択されたファイル:</Typography>
              <Typography variant="body2" color="text.secondary">
                {importFile.name} ({Math.round(importFile.size / 1024)} KB)
              </Typography>
            </Box>
          )}

          {/* バリデーション結果 */}
          {validationLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">データを検証中...</Typography>
            </Box>
          )}

          {validation && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {validation.valid ? (
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                )}
                <Typography variant="subtitle2">
                  {validation.valid ? 'データ検証: 成功' : 'データ検証: エラー'}
                </Typography>
              </Box>

              {validation.errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>エラー:</Typography>
                  <List dense>
                    {validation.errors.map((error, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {validation.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>警告:</Typography>
                  <List dense>
                    {validation.warnings.map((warning, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  インポート対象データ:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {Object.entries(validation.stats).map(([key, value]) => (
                    <Chip key={key} label={`${key}: ${value}`} size="small" />
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* インポートカテゴリ選択 */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            インポートカテゴリ
          </Typography>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.categories?.users || false}
                  onChange={(e) =>
                    setImportOptions(prev => ({
                      ...prev,
                      categories: {
                        ...prev.categories,
                        users: e.target.checked,
                      } as ImportCategories
                    }))
                  }
                />
              }
              label="ユーザー"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mb: 0.5 }}>
              ユーザーアカウント情報
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.categories?.scenesAndTemplates || false}
                  onChange={(e) =>
                    setImportOptions(prev => ({
                      ...prev,
                      categories: {
                        ...prev.categories,
                        scenesAndTemplates: e.target.checked,
                      } as ImportCategories
                    }))
                  }
                />
              }
              label="シーン・定型文"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mb: 0.5 }}>
              シーン、タグ、定型文、定型文バージョン、使用履歴
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.categories?.projectsAndDocuments || false}
                  onChange={(e) =>
                    setImportOptions(prev => ({
                      ...prev,
                      categories: {
                        ...prev.categories,
                        projectsAndDocuments: e.target.checked,
                      } as ImportCategories
                    }))
                  }
                />
              }
              label="プロジェクト・文書"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mb: 0.5 }}>
              プロジェクト、プロジェクト変数、文書
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.categories?.systemSettings || false}
                  onChange={(e) =>
                    setImportOptions(prev => ({
                      ...prev,
                      categories: {
                        ...prev.categories,
                        systemSettings: e.target.checked,
                      } as ImportCategories
                    }))
                  }
                />
              }
              label="システム設定"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
              ユーザー変数、ユーザー設定
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* インポートオプション */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            インポートオプション
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={importOptions.clearExistingData}
                onChange={(e) =>
                  setImportOptions(prev => ({
                    ...prev,
                    clearExistingData: e.target.checked
                  }))
                }
              />
            }
            label="既存データを削除してからインポート"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
            ⚠️ この操作は取り消せません
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={importOptions.preserveIds}
                onChange={(e) =>
                  setImportOptions(prev => ({
                    ...prev,
                    preserveIds: e.target.checked
                  }))
                }
              />
            }
            label="IDを保持してインポート"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
            推奨: データの整合性を保つため
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>
            キャンセル
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!validation?.valid || importLoading}
            startIcon={importLoading ? <CircularProgress size={20} /> : undefined}
          >
            {importLoading ? 'インポート中...' : 'インポート実行'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataManagementPanel;