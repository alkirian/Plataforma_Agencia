import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  BellIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { getClients } from '../../api/clients';
import { useEscapeClose } from '../../hooks';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Toggle Command Palette on Ctrl + K or Cmd + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch clients when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      getClients()
        .then((res) => {
          const list = res?.data ?? res ?? [];
          setClients(list);
        })
        .catch((err) => console.error('Error fetching clients for command palette:', err));
    }
  }, [isOpen]);

  // Hook to close on Escape
  useEscapeClose(isOpen, () => setIsOpen(false));

  // Define static commands
  const staticCommands = useMemo(() => [
    {
      id: 'go-dashboard',
      title: 'Ir al Dashboard',
      subtitle: 'Navegar a la pantalla principal',
      category: 'Navegación',
      icon: HomeIcon,
      action: () => navigate('/dashboard'),
    },
    {
      id: 'go-trends',
      title: 'Ir a Tendencias',
      subtitle: 'Explorar las últimas tendencias de marketing',
      category: 'Navegación',
      icon: ArrowTrendingUpIcon,
      action: () => navigate('/trends'),
    },
    {
      id: 'go-settings',
      title: 'Ir a Configuración',
      subtitle: 'Administrar perfil, plan y equipo',
      category: 'Navegación',
      icon: Cog6ToothIcon,
      action: () => navigate('/settings'),
    },
    {
      id: 'action-new-client',
      title: 'Crear Nuevo Cliente',
      subtitle: 'Abrir el asistente de onboarding de clientes',
      category: 'Acciones',
      icon: UserPlusIcon,
      action: () => {
        const btn = document.getElementById('add-client-button');
        if (btn) btn.click();
      },
    },
    {
      id: 'action-toggle-notifications',
      title: 'Alternar Notificaciones',
      subtitle: 'Mostrar u ocultar el panel de alertas',
      category: 'Acciones',
      icon: BellIcon,
      action: () => {
        const btn = document.querySelector('button[title="Notificaciones"]');
        if (btn) btn.click();
      },
    },
    {
      id: 'action-aura-chat',
      title: 'Hablar con Aura (Chat IA)',
      subtitle: 'Abrir el panel del asistente cognitivo',
      category: 'Acciones',
      icon: SparklesIcon,
      action: () => {
        window.dispatchEvent(new CustomEvent('cadence:open-aura-chat'));
      },
    },
    {
      id: 'action-shortcuts',
      title: 'Mostrar Atajos de Teclado',
      subtitle: 'Ver ayuda sobre las combinaciones de teclas',
      category: 'Ayuda',
      icon: QuestionMarkCircleIcon,
      action: () => {
        document.dispatchEvent(new CustomEvent('show-keyboard-help'));
      },
    },
    {
      id: 'action-logout',
      title: 'Cerrar Sesión',
      subtitle: 'Salir de tu cuenta de Cadence',
      category: 'Cuenta',
      icon: ArrowRightOnRectangleIcon,
      action: () => {
        window.dispatchEvent(new CustomEvent('cadence:logout'));
      },
    },
  ], [navigate]);

  // Compute filtered items
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    
    // Filter static commands
    const matchesStatic = staticCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );

    // Map and filter clients
    const matchesClients = clients
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.industry?.toLowerCase().includes(q)
      )
      .map((c) => ({
        id: `client-${c.id}`,
        title: c.name,
        subtitle: c.industry || 'Cliente de la Agencia',
        category: 'Clientes',
        logo_url: c.logo_url,
        action: () => navigate(`/clients/${c.id}`),
      }));

    return [...matchesStatic, ...matchesClients];
  }, [query, staticCommands, clients, navigate]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keydown for selection
  const handleKeyDown = (e) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) {
        item.action();
        setIsOpen(false);
      }
    }
  };

  // Group items by category for rendering
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item, index) => {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ ...item, globalIndex: index });
    });
    return groups;
  }, [filteredItems]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[90] flex items-start justify-center p-4 sm:p-10 pt-[10vh]'>
      {/* Backdrop */}
      <div 
        className='absolute inset-0 bg-black/60 backdrop-blur-sm' 
        onClick={() => setIsOpen(false)} 
      />

      {/* Palette dialog */}
      <motion.div
        initial={{ scale: 0.97, y: -10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.97, y: -10, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className='relative w-full max-w-2xl bg-surface-strong/95 border border-border-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[70vh]'
      >
        {/* Search header */}
        <div className='flex items-center gap-3 p-4 border-b border-border-subtle'>
          <MagnifyingGlassIcon className='h-5 w-5 text-text-muted flex-shrink-0' />
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Escribe un comando o el nombre de un cliente…'
            className='flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm'
          />
          <kbd className='text-[10px] text-text-muted border border-border-subtle bg-surface-soft px-1.5 py-0.5 rounded shadow-sm select-none'>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className='flex-1 overflow-y-auto p-2 space-y-4'>
          {filteredItems.length === 0 ? (
            <div className='py-12 text-center text-xs text-text-muted font-medium'>
              No se encontraron comandos o clientes coincidentes.
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className='space-y-1'>
                <div className='px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider'>
                  {category}
                </div>
                {items.map((item) => {
                  const isSelected = item.globalIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        item.action();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 ${
                        isSelected ? 'bg-surface-soft text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      <div className='flex items-center gap-3 min-w-0'>
                        {Icon ? (
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-accent-lavender' : 'text-text-muted'}`} />
                        ) : item.logo_url ? (
                          <img
                            src={item.logo_url}
                            alt={item.title}
                            className='h-5 w-5 rounded object-cover border border-white/10 flex-shrink-0'
                          />
                        ) : (
                          <div className='h-5 w-5 rounded bg-accent-lavender/20 border border-accent-lavender/30 text-accent-lavender flex items-center justify-center font-bold text-[10px] flex-shrink-0'>
                            {item.title ? item.title.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div className='min-w-0'>
                          <div className='text-xs font-semibold truncate'>{item.title}</div>
                          <div className='text-[10px] text-text-muted truncate'>{item.subtitle}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <kbd className='text-[9px] text-text-muted border border-border-subtle bg-surface-strong px-1 rounded shadow-sm select-none'>
                          ↵
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className='p-3 border-t border-border-subtle bg-surface-strong/50 flex justify-between items-center text-[10px] text-text-muted font-medium select-none'>
          <div className='flex gap-4'>
            <span>↑↓ para navegar</span>
            <span>↵ para seleccionar</span>
          </div>
          <span>Paleta de comandos</span>
        </div>
      </motion.div>
    </div>
  );
};
