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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import {
  useGetUserListQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  AdminUser
} from '../../store/api/adminApi';

interface UserFormData {
  email: string;
  displayName: string;
  username: string;
  isAdmin: boolean;
  password: string;
}

const UserManagement: React.FC = memo(() => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    displayName: '',
    username: '',
    isAdmin: false,
    password: '',
  });

  const { data, isLoading, error } = useGetUserListQuery({
    page: page + 1,
    limit: rowsPerPage,
  });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setEditingUser(null);
    setFormData({
      email: '',
      displayName: '',
      username: '',
      isAdmin: false,
      password: '',
    });
    setOpenDialog(true);
  }, []);

  const handleOpenEditDialog = useCallback((user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      displayName: user.displayName || '',
      username: user.username || '',
      isAdmin: user.isAdmin,
      password: '',
    });
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      email: '',
      displayName: '',
      username: '',
      isAdmin: false,
      password: '',
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.email.trim()) {
      return;
    }

    try {
      if (editingUser) {
        await updateUser({
          id: editingUser.id,
          data: {
            email: formData.email,
            displayName: formData.displayName || undefined,
            username: formData.username || undefined,
            isAdmin: formData.isAdmin,
          },
        }).unwrap();
      } else {
        if (!formData.password.trim()) {
          return;
        }
        await createUser({
          email: formData.email,
          displayName: formData.displayName || undefined,
          username: formData.username || undefined,
          isAdmin: formData.isAdmin,
          password: formData.password,
        }).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('ユーザーの保存に失敗しました:', error);
    }
  }, [formData, editingUser, createUser, updateUser, handleCloseDialog]);

  const handleDeleteClick = useCallback((user: AdminUser) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id).unwrap();
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('ユーザーの削除に失敗しました:', error);
      }
    }
  }, [userToDelete, deleteUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        ユーザー一覧の読み込み中にエラーが発生しました
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">ユーザー管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          新規作成
        </Button>
      </Box>

      <Paper>
        <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
          <Table stickyHeader>
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
                <TableCell align="right">操作</TableCell>
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
                  <TableCell>{user._count.createdTemplates}</TableCell>
                  <TableCell>{user._count.createdProjects}</TableCell>
                  <TableCell>{user._count.documents}</TableCell>
                  <TableCell>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditDialog(user)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(user)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      ユーザーがありません
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
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

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'ユーザー編集' : '新規ユーザー作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="メールアドレス"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="表示名"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              fullWidth
            />

            <TextField
              label="ユーザー名"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              fullWidth
            />

            {!editingUser && (
              <TextField
                label="パスワード"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                fullWidth
              />
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                />
              }
              label="管理者権限"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isCreating || isUpdating || !formData.email.trim() || (!editingUser && !formData.password.trim())}
          >
            {isCreating || isUpdating ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>ユーザー削除の確認</DialogTitle>
        <DialogContent>
          <Typography>
            「{userToDelete?.displayName || userToDelete?.username || userToDelete?.email}」を削除しますか？この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});
UserManagement.displayName = 'UserManagement';

export default UserManagement;