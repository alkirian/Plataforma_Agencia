import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ExportModal } from './ExportModal';

// Botón minimalista reutilizable y totalmente adaptativo
const MiniButton = ({ children, onClick, active, title, className = '' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2 py-1 text-[11px] rounded-md border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors leading-none bg-surface ${active ? 'bg-surface-strong text-text-primary border-border-strong font-semibold' : ''} ${className}`}
  >
    {children}
  </button>
);

export const CalendarToolbar = ({
  label,
  onNavigate,
  events = [],
  clientName = ''
}) => {
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="bg-surface-soft border border-border-subtle rounded-lg px-2 py-1.5 mb-2 shadow-sm">
      <div className="flex items-center justify-between gap-1.5">
        {/* Izquierda: navegación */}
        <div className="flex items-center gap-1.5 min-w-0">
          <MiniButton onClick={() => onNavigate('TODAY')} title="Ir a hoy">
            Hoy
          </MiniButton>

          <div className="h-3.5 w-px bg-border-subtle" />

          <MiniButton onClick={() => onNavigate('PREV')} title="Anterior" className="!px-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </MiniButton>

          <div className="text-[11px] font-semibold text-text-primary capitalize truncate max-w-[190px]">
            {label}
          </div>

          <MiniButton onClick={() => onNavigate('NEXT')} title="Siguiente" className="!px-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </MiniButton>
        </div>

        <div className="flex-1" />

        {/* Derecha: export */}
        <MiniButton onClick={() => setShowExportModal(true)} title="Exportar calendario" className="!py-1">
          <span className="sr-only">Exportar</span>
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        </MiniButton>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        events={events}
        clientName={clientName}
      />
    </div>
  );
};
