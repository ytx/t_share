import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import { CircularProgress, Box } from '@mui/material'
import MainLayout from './components/Layout/MainLayout'

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const PendingApproval = lazy(() => import('./pages/PendingApproval'))
const AuthError = lazy(() => import('./pages/AuthError'))

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
)

function App() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/pending-approval" element={<PendingApproval />} />
          <Route path="/auth/error" element={<AuthError />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {user?.isAdmin && (
          <Route
            path="/admin"
            element={
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            }
          />
        )}
        <Route
          path="*"
          element={
            <MainLayout>
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>404 - Page Not Found</h2>
                <p>このページは存在しません</p>
              </div>
            </MainLayout>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App