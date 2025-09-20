import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { store } from './store'
import { CustomThemeProvider } from './contexts/ThemeContext'
import './styles/global.css'

// Configure ACE editor
import ace from 'ace-builds/src-noconflict/ace'
ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict/')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <CustomThemeProvider>
          <App />
        </CustomThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)