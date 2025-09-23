import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import { loginSuccess } from '../store/slices/authSlice';
import { AppDispatch } from '../store';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const reason = searchParams.get('reason');

    if (token) {
      // Store token in localStorage
      localStorage.setItem('authToken', token);

      // Decode JWT token to get user info
      try {
        JSON.parse(atob(token.split('.')[1]));

        // Fetch user details using the token
        const fetchUserDetails = async () => {
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const { user } = await response.json();
              dispatch(loginSuccess({ user, token }));
              navigate('/dashboard');
            } else {
              navigate('/login?error=auth_failed');
            }
          } catch (error) {
            console.error('Failed to fetch user details:', error);
            navigate('/login?error=auth_failed');
          }
        };

        fetchUserDetails();
      } catch (error) {
        console.error('Failed to decode token:', error);
        navigate('/login?error=invalid_token');
      }
    } else if (reason) {
      // Handle error cases
      switch (reason) {
        case 'unknown_status':
          navigate('/login?error=unknown_status');
          break;
        default:
          navigate('/login?error=auth_failed');
      }
    } else {
      navigate('/login?error=missing_params');
    }
  }, [navigate, dispatch, searchParams]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        ログイン処理中...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        しばらくお待ちください
      </Typography>
    </Box>
  );
};

export default AuthCallback;