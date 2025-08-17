// src/components/schedule/CalendarToolbar.jsx
import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ExportModal } from './ExportModal';

export const CalendarToolbar = ({ 
  label, 
  onNavigate, 
  onView, 
  view, 
  events = [], 
  clientName = '' 
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Obtener texto contextual para navegación según la vista
  const getNavigationContext = () => {
    switch(view) {
      case 'timeGridWeek':
        return { text: '🗓️ Semanas', tip: 'Navegando semana por semana' };
      case 'timeGridDay':
        return { text: '📅 Días', tip: 'Navegando día por día' };
      case 'listMonth':
        return { text: '📋 Agenda del mes', tip: 'Mostrando todas las tareas del mes' };
      case 'dayGridMonth':
      default:
        return { text: '🗓️ Meses', tip: 'Navegando mes por mes' };
    }
  };
  const Button = ({ children, onClick, active }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md border transition-colors
      ${active ? 'bg-[color:var(--color-accent-blue)] text-black border-[color:var(--color-accent-blue)]' : 'bg-white/5 text-text-primary/80 border-[color:var(--color-border-subtle)] hover:bg-white/10'}`}
    >
      {children}
    </button>
  );

  return (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2'>
      <div className='flex items-center gap-2'>
        <Button onClick={() => onNavigate('TODAY')}>Hoy</Button>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1'>
            <Button onClick={() => onNavigate('PREV')} className="hover:scale-105 transition-transform">
              ◀
            </Button>
            <div className='px-4 py-2 text-text-primary/90 text-sm font-medium border border-[color:var(--color-border-subtle)] rounded-lg bg-white/10 backdrop-blur-sm min-w-[180px] text-center'>
              {label}
            </div>
            <Button onClick={() => onNavigate('NEXT')} className="hover:scale-105 transition-transform">
              ▶
            </Button>
          </div>
          
          {/* Indicador de contexto de navegación */}
          <div className='px-2 py-1 text-xs text-text-primary/60 bg-white/5 rounded-md border border-[color:var(--color-border-subtle)]' title={getNavigationContext().tip}>
            {getNavigationContext().text}
          </div>
          
          {/* Indicador de keyboard shortcuts */}
          <div className='px-2 py-1 text-xs text-text-primary/40 bg-white/5 rounded-md border border-[color:var(--color-border-subtle)]' title='Atajos: Ctrl+← → (navegar), Ctrl+T (hoy), Ctrl+1-4 (vistas)'>
            ⌨️
          </div>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Button onClick={() => onView('month')} active={view === 'dayGridMonth' || view === 'month'}>
          <span>Mes</span>
          <span className='text-xs opacity-60 ml-1'>1</span>
        </Button>
        <Button onClick={() => onView('week')} active={view === 'timeGridWeek' || view === 'week'}>
          <span>Semana</span>
          <span className='text-xs opacity-60 ml-1'>2</span>
        </Button>
        <Button onClick={() => onView('day')} active={view === 'timeGridDay' || view === 'day'}>
          <span>Día</span>
          <span className='text-xs opacity-60 ml-1'>3</span>
        </Button>
        <Button onClick={() => onView('agenda')} active={view === 'listMonth' || view === 'agenda'}>
          <span>Agenda</span>
          <span className='text-xs opacity-60 ml-1'>4</span>
        </Button>
        
        {/* Separador */}
        <div className="h-6 w-px bg-white/20 mx-1" />
        
        {/* Botón de exportar */}
        <button
          onClick={() => setShowExportModal(true)}
          className="px-3 py-1.5 text-sm rounded-md border border-[color:var(--color-accent-blue)]/30 bg-[color:var(--color-accent-blue)]/10 
                     text-[color:var(--color-accent-blue)] hover:bg-[color:var(--color-accent-blue)]/20 transition-colors flex items-center gap-2"
          title="Exportar calendario"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Modal de exportación */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        events={events}
        clientName={clientName}
      />
    </div>
  );
};
