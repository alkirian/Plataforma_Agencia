import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './App.css';
import './styles/globals.css';
import './styles/calendar-unified.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, LanguageProvider, ThemeProvider } from './hooks/index.js';

// Crea una instancia del cliente de consultas con configuraciones óptimas de rendimiento
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Desactiva la tormenta de llamadas al cambiar de ventana/pestaña
      staleTime: 1000 * 30, // Los datos se consideran frescos durante 30 segundos
      gcTime: 1000 * 60 * 5, // Mantener en memoria caché inactiva por 5 minutos (anteriormente cacheTime)
      retry: 1, // Limita los reintentos a 1 para mejor feedback visual de errores
    },
  },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

