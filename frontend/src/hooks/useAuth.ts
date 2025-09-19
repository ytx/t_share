import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '../store';
import { loginUser, registerUser, logout, getCurrentUser, updateProfile, clearError } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);

  const login = useCallback(
    (credentials: { email: string; password: string }) => {
      return dispatch(loginUser(credentials));
    },
    [dispatch]
  );

  const register = useCallback(
    (userData: { email: string; username?: string; displayName?: string; password: string }) => {
      return dispatch(registerUser(userData));
    },
    [dispatch]
  );

  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const refreshUser = useCallback(() => {
    return dispatch(getCurrentUser());
  }, [dispatch]);

  const updateUserProfile = useCallback(
    (userData: { username?: string; displayName?: string }) => {
      return dispatch(updateProfile(userData));
    },
    [dispatch]
  );

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,

    // Actions
    login,
    register,
    logout: logoutUser,
    refreshUser,
    updateProfile: updateUserProfile,
    clearError: clearAuthError,
  };
};