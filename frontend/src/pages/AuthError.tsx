import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import { Error, Home, Refresh } from '@mui/icons-material';

const AuthError: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  const getErrorMessage = (errorReason: string | null) => {
    switch (errorReason) {
      case 'unknown_status':
        return 'アカウントの状態が不明です。管理者にお問い合わせください。';
      case 'auth_failed':
        return '認証に失敗しました。もう一度お試しください。';
      case 'invalid_token':
        return '無効なトークンです。再度ログインしてください。';
      case 'missing_params':
        return '必要なパラメータが不足しています。';
      default:
        return '認証中にエラーが発生しました。';
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            認証エラー
          </Typography>

          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            <Typography variant="body1">
              {getErrorMessage(reason)}
            </Typography>
          </Alert>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              問題が解決しない場合は、管理者にお問い合わせください。
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              startIcon={<Home />}
            >
              ログイン画面に戻る
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outlined"
              startIcon={<Refresh />}
            >
              再試行
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthError;