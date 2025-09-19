import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, Container, Typography } from '@mui/material'

import Layout from './components/Layout/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Container maxWidth="lg">
              <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                  Template Share
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  定型文管理・共有Webアプリケーション
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1">
                    🚀 アプリケーションが正常に起動しました！
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Phase 1.1: プロジェクトセットアップ完了
                  </Typography>
                </Box>
              </Box>
            </Container>
          }
        />
        <Route
          path="*"
          element={
            <Container maxWidth="lg">
              <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4">404 - Page Not Found</Typography>
              </Box>
            </Container>
          }
        />
      </Routes>
    </Layout>
  )
}

export default App