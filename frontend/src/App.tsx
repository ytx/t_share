import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AdminDashboard from './components/Admin/AdminDashboard'
import AuthCallback from './pages/AuthCallback'
import PendingApproval from './pages/PendingApproval'
import AuthError from './pages/AuthError'

function App() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/pending-approval" element={<PendingApproval />} />
        <Route path="/auth/error" element={<AuthError />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
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
  )
}

export default App