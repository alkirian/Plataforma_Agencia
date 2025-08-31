import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { SearchBar } from './SearchBar';

// Botón minimalista reutilizable (tabs sutiles / estética de referencia)
const MiniButton = ({ children, onClick, active, title, className = '' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2.5 py-1 text-[11px] rounded-md border border-[color:var(--color-border-subtle)] text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors ${active ? 'bg-[#151a21] text-text-primary border-[color:var(--color-border-strong)]' : ''} ${className}`}
    style={{ fontWeight: 600, letterSpacing: '0.02em' }}
  >
    {children}
  </button>
);

export const CalendarToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  events = [],
  clientName = '',
  isChatOpen = false,
  onJumpToEvent
}) => {
  const [showExportModal, setShowExportModal] = useState(false);

  const isMonth = view === 'dayGridMonth' || view === 'month';
  const isWeek = view === 'timeGridWeek' || view === 'week';
  const isDay = view === 'timeGridDay' || view === 'day';
  const isAgenda = view === 'listMonth' || view === 'agenda';

  return (
    <div className="bg-surface-strong/70 border border-[color:var(--color-border-subtle)] rounded-lg p-2 mb-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        {/* Izquierda: navegación */}
        <div className="flex items-center gap-2 min-w-0">
          <MiniButton onClick={() => onNavigate('TODAY')} title="Ir a hoy">
            Hoy
          </MiniButton>

          <div className="h-4 w-px bg-gray-700/50" />

          <MiniButton onClick={() => onNavigate('PREV')} title="Anterior" className="!px-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </MiniButton>

          <div className={`text-xs font-semibold text-text-primary/90 tracking-wide truncate ${isChatOpen ? 'max-w-[110px] sm:max-w-[160px]' : 'max-w-[200px]'}`}>
            {label}
          </div>

          <MiniButton onClick={() => onNavigate('NEXT')} title="Siguiente" className="!px-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </MiniButton>
        </div>

        {/* Centro: vistas tipo segmented */}
        <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-md border border-[color:var(--color-border-subtle)]">
          <MiniButton onClick={() => onView('month')} active={isMonth} title="Vista mes">
            {isChatOpen ? 'M' : 'Mes'}
          </MiniButton>
          <MiniButton onClick={() => onView('week')} active={isWeek} title="Vista semana">
            {isChatOpen ? 'S' : 'Semana'}
          </MiniButton>
          <MiniButton onClick={() => onView('day')} active={isDay} title="Vista día">
            {isChatOpen ? 'D' : 'Día'}
          </MiniButton>
          <MiniButton onClick={() => onView('agenda')} active={isAgenda} title="Vista agenda">
            {isChatOpen ? 'A' : 'Agenda'}
          </MiniButton>
        </div>

        {/* Derecha: búsqueda + export */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <SearchBar events={events} onSelect={onJumpToEvent} />
          <MiniButton onClick={() => setShowExportModal(true)} title="Exportar calendario" className="!py-1.5">
            <span className="sr-only">Exportar</span>
            <Download className="w-4 h-4" />
          </MiniButton>
        </div>
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

