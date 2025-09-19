import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  Search,
  Code,
  Person,
} from '@mui/icons-material';
import { useGetProjectVariablesQuery, useDeleteProjectVariableMutation } from '../../store/api/projectVariableApi';
import VariableEditModal from './VariableEditModal';
import ConfirmDialog from '../Common/ConfirmDialog';

interface ProjectVariablesListProps {
  projectId: number;
}

const ProjectVariablesList: React.FC<ProjectVariablesListProps> = ({ projectId }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingVariable, setEditingVariable] = useState<any>(null);
  const [deletingVariableId, setDeletingVariableId] = useState<number | null>(null);

  const { data: variablesResponse, isLoading, error } = useGetProjectVariablesQuery(projectId);
  const [deleteVariable, { isLoading: isDeleting }] = useDeleteProjectVariableMutation();

  const variables = variablesResponse?.data || [];

  // Filter variables based on search keyword
  const filteredVariables = variables.filter(variable =>
    variable.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    variable.value.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (variable.description && variable.description.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  const handleEditVariable = (variable: any) => {
    setEditingVariable(variable);
  };

  const handleDeleteVariable = async () => {
    if (deletingVariableId) {
      try {
        await deleteVariable(deletingVariableId).unwrap();
        setDeletingVariableId(null);
      } catch (error) {
        console.error('変数の削除に失敗しました:', error);
      }
    }
  };

  const handleCopyVariableName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(`{{${name}}}`);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        プロジェクト変数の読み込み中にエラーが発生しました
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="変数名、値、説明で検索..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>

      {/* Variables Table */}
      {filteredVariables.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            {searchKeyword ? '検索条件に一致する変数が見つかりませんでした' : 'プロジェクト変数がありません'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>変数名</TableCell>
                <TableCell>値</TableCell>
                <TableCell>説明</TableCell>
                <TableCell>作成者</TableCell>
                <TableCell>更新日時</TableCell>
                <TableCell align="center">アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVariables.map((variable) => (
                <TableRow key={variable.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`{{${variable.name}}}`}
                        variant="outlined"
                        size="small"
                        onClick={() => handleCopyVariableName(variable.name)}
                        clickable
                        icon={<Code />}
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {variable.value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {variable.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {variable.creator?.displayName || variable.creator?.username || 'Unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(variable.updatedAt).toLocaleDateString('ja-JP')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="編集">
                        <IconButton
                          size="small"
                          onClick={() => handleEditVariable(variable)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton
                          size="small"
                          onClick={() => setDeletingVariableId(variable.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Modal */}
      {editingVariable && (
        <VariableEditModal
          open={true}
          onClose={() => setEditingVariable(null)}
          variable={editingVariable}
          variableType="project"
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deletingVariableId !== null}
        onClose={() => setDeletingVariableId(null)}
        onConfirm={handleDeleteVariable}
        title="変数を削除"
        content="この変数を削除してもよろしいですか？この操作は取り消せません。"
        loading={isDeleting}
      />
    </Box>
  );
};

export default ProjectVariablesList;