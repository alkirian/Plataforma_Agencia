import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import './styles/globals.css'
import './styles/calendar-modern.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Crea una instancia del cliente de consultas
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
