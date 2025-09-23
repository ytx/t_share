import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import { HourglassEmpty, Home } from '@mui/icons-material';

const PendingApproval: React.FC = () => {
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
          <HourglassEmpty sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            承認待ち
          </Typography>

          <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
            <Typography variant="body1">
              アカウントが作成されましたが、管理者による承認が必要です。
            </Typography>
          </Alert>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" paragraph>
              Googleアカウントでのログインが完了しましたが、このシステムを利用するには管理者による承認が必要です。
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              承認が完了すると、登録されたメールアドレスに通知が送信されます。
              しばらくお待ちください。
            </Typography>
          </Box>

          <Button
            component={Link}
            to="/login"
            variant="contained"
            startIcon={<Home />}
            sx={{ mt: 2 }}
          >
            ログイン画面に戻る
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default PendingApproval;