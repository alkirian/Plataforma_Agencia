import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'react-hot-toast';
import { useAppKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { getClients } from '../../api/clients';
import { AgentChatPanel, CommandPalette, InteractiveGSAPCharacter } from '../ui';
import { DashboardTour } from '../common/DashboardTour';
import { motion, AnimatePresence } from 'framer-motion';

export const MainLayout = ({ children, userEmail, profile, onLogout }) => {
  // Activar atajos de teclado globales
  useAppKeyboardShortcuts();

  const location = useLocation();
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatButtonHovered, setIsChatButtonHovered] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('cadence_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('cadence_sidebar_collapsed', String(newVal));
      
      // Dispatch transition start event
      window.dispatchEvent(
        new CustomEvent('cadence:sidebar-transition-start', {
          detail: { collapsed: newVal },
        })
      );
      
      // Force instant window resize to start drawing updates
      window.dispatchEvent(new Event('resize'));
      return newVal;
    });
  };

  // Dispatch another resize when transition completes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(
        new CustomEvent('cadence:sidebar-transition-end', {
          detail: { collapsed: isSidebarCollapsed },
        })
      );
    }, 320);
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);

  // Listen to Alt + B shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true' ||
          activeElement.getAttribute('role') === 'textbox');

      if (isInput) return;

      if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to custom events from CommandPalette
  useEffect(() => {
    const handleOpenChat = () => {
      setIsChatOpen(true);
    };
    const handleLogout = () => {
      onLogout?.();
    };

    window.addEventListener('cadence:open-aura-chat', handleOpenChat);
    window.addEventListener('cadence:logout', handleLogout);

    return () => {
      window.removeEventListener('cadence:open-aura-chat', handleOpenChat);
      window.removeEventListener('cadence:logout', handleLogout);
    };
  }, [onLogout]);


  // Obtener todos los clientes
  const { data: clientsResponse } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });
  const clients = clientsResponse?.data || [];

  // Detectar el cliente activo en la ruta actual (/clients/:id)
  const match = location.pathname.match(/\/clients\/([a-fA-F0-9-]+)/);
  const routeClientId = match ? match[1] : null;

  const [selectedClientId, setSelectedClientId] = useState(() => {
    return localStorage.getItem('cadence_last_active_client_id') || null;
  });

  // Sincronizar el cliente seleccionado con la ruta
  useEffect(() => {
    if (routeClientId) {
      setSelectedClientId(routeClientId);
      localStorage.setItem('cadence_last_active_client_id', routeClientId);
    }
  }, [routeClientId]);

  // Fallback al primer cliente si no hay activo guardado
  useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id);
      localStorage.setItem('cadence_last_active_client_id', clients[0].id);
    }
  }, [clients, selectedClientId]);

  const currentClient = clients.find(c => c.id === selectedClientId) || null;

  // Escuchar el evento global para abrir el chat
  useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true);
    window.addEventListener('cadence:open-aura-chat', handleOpenChat);
    return () => window.removeEventListener('cadence:open-aura-chat', handleOpenChat);
  }, []);

  // Detectar transiciones de apertura/cierre del chat para despachar eventos globales
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const isMobile = window.innerWidth < 640;
    const panelWidth = isMobile ? window.innerWidth : 460;

    window.dispatchEvent(
      new CustomEvent('cadence:chat-transition-start', {
        detail: { open: isChatOpen, width: panelWidth },
      })
    );

    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('cadence:chat-transition-end', {
          detail: { open: isChatOpen, width: panelWidth },
        })
      );
    }, 380); // 350ms transition + 30ms buffer

    return () => clearTimeout(timer);
  }, [isChatOpen]);

  const handleClientChange = (newClientId) => {
    setSelectedClientId(newClientId);
    localStorage.setItem('cadence_last_active_client_id', newClientId);
    
    // Si estamos en la página de un cliente, redirigir al nuevo cliente
    if (location.pathname.startsWith('/clients/')) {
      navigate(`/clients/${newClientId}${location.search}`);
    }
  };

  return (
    <div className='flex h-screen w-screen overflow-hidden bg-app text-text-primary font-sans keyboard-nav relative'>
      {/* Sidebar de navegación y lista de clientes */}
      <Sidebar 
        userEmail={userEmail} 
        profile={profile} 
        onLogout={onLogout} 
        isCollapsed={isSidebarCollapsed} 
      />
      
      {/* Botón flotante para alternar Sidebar */}
      <button
        onClick={toggleSidebar}
        style={{
          left: isSidebarCollapsed ? '16px' : '226px', // Centrado en la línea divisoria (240px - 14px)
          transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms ease, background-color 200ms'
        }}
        className="absolute top-1/2 -translate-y-1/2 z-50 w-7 h-7 flex items-center justify-center rounded-full bg-surface hover:bg-surface-soft border border-border-subtle hover:border-border-strong text-text-muted hover:text-text-primary shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
        title={isSidebarCollapsed ? "Mostrar barra lateral (Alt+B)" : "Ocultar barra lateral (Alt+B)"}
      >
        {isSidebarCollapsed ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Área del contenedor principal y vistas */}
      <div className='flex-1 flex h-screen overflow-hidden relative'>
        {/* Contenedor de la vista principal */}
        <div className='flex-1 flex flex-col h-full min-w-0 overflow-hidden relative'>
          <Toaster
            position='bottom-right'
            toastOptions={{
              style: {
                background: 'var(--color-surface-soft)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '14px',
                fontFamily: 'inherit',
                fontSize: '13px',
              },
            }}
          />
          <Header userEmail={userEmail} profile={profile} onLogout={onLogout} />
          <main id='main-content' className='flex-1 overflow-y-auto w-full'>
            {children}
          </main>
        </div>
          {/* Botón flotante global de Aura (Sólo visible cuando el chat está cerrado) */}
          <AnimatePresence>
            {selectedClientId && !isChatOpen && (
              <div className="absolute bottom-6 right-6 z-40 pointer-events-auto">
                <motion.button
                  onClick={() => setIsChatOpen(true)}
                  onMouseEnter={() => setIsChatButtonHovered(true)}
                  onMouseLeave={() => setIsChatButtonHovered(false)}
                  data-tour="aura-chat-toggle"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                  className="relative group w-12 h-12 flex items-center justify-center rounded-full bg-slate-900 bg-opacity-90 border text-white shadow-2xl transition-all duration-300 backdrop-blur-md cursor-pointer hover:border-[#7C5CFC] hover:border-opacity-40 overflow-visible"
                  title="Abrir chat de Aura"
                >
                  {/* Glowing background blur */}
                  <div 
                    style={{
                      backgroundImage: 'linear-gradient(to bottom right, rgba(124, 92, 252, 0.2), rgba(78, 205, 196, 0.1))'
                    }}
                    className="absolute inset-0 rounded-full transition-opacity duration-300 blur-md opacity-0 group-hover:opacity-100" 
                  />
                  
                  {/* Green active dot in the corner */}
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900 z-25 animate-pulse" />
                  
                  {/* Miniature Chatter character scaled down */}
                  <div className="w-12 h-12 flex items-center justify-center overflow-visible scale-[0.38] origin-center relative z-10 pointer-events-none">
                    <InteractiveGSAPCharacter
                      preset="chatter"
                      emotion={isChatButtonHovered ? 'excited' : 'happy'}
                      size="sm"
                      className="pointer-events-none"
                    />
                  </div>
                </motion.button>
              </div>
            )}
          </AnimatePresence>

        {/* Panel de Chat de Aura deslizable global */}
        <AnimatePresence>
          {isChatOpen && selectedClientId && (
            <AgentChatPanel
              clientId={selectedClientId}
              agent={{ id: 'general', name: 'Aura' }}
              onClose={() => setIsChatOpen(false)}
              client={currentClient}
              onClientIdChange={handleClientChange}
            />
          )}
        </AnimatePresence>

        <DashboardTour />
        <CommandPalette />
      </div>
    </div>
  );
};
