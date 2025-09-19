import React from 'react'
import { Box, AppBar, Toolbar, Typography } from '@mui/material'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Template Share
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  )
}

export default Layout