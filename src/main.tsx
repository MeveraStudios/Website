import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n'
import App from './App.tsx'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CodeThemeProvider } from '@/components/CodeThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <CodeThemeProvider>
          <App />
        </CodeThemeProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
