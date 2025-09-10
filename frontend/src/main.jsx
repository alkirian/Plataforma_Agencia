import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import './styles/globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@shared/theme'

// Crea una instancia del cliente de consultas
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider 
      defaultPalette="orangeProfessional" 
      defaultMode="dark"
      persistPreferences={true}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
)
