import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/lexend'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n'
import './pwa/install'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
