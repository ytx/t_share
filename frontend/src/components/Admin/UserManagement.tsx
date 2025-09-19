import React, { useState, memo, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useGetUserListQuery } from '../../store/api/adminApi';

const UserManagement: React.FC = memo(() => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const { data, isLoading, error } = useGetUserListQuery({
    page: page + 1,
    limit: rowsPerPage,
  });

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

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
        ユーザー一覧の読み込み中にエラーが発生しました
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        ユーザー管理
      </Typography>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>表示名</TableCell>
                <TableCell>権限</TableCell>
                <TableCell>テンプレート</TableCell>
                <TableCell>プロジェクト</TableCell>
                <TableCell>文書</TableCell>
                <TableCell>登録日</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.displayName || user.username || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isAdmin ? '管理者' : '一般ユーザー'}
                      color={user.isAdmin ? 'secondary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user._count.templates}</TableCell>
                  <TableCell>{user._count.projects}</TableCell>
                  <TableCell>{user._count.documents}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {data && (
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={data.pagination.total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
    </Box>
  );
});
UserManagement.displayName = 'UserManagement';

export default UserManagement;