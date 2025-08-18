import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ExportModal } from './ExportModal';

// Botón minimalista reutilizable
const MiniButton = ({ children, onClick, active, title, className = '' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2 py-1 text-xs rounded-md border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800/60 transition-colors ${active ? 'bg-gray-800 text-white border-gray-600' : ''} ${className}`}
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
  isChatOpen = false
}) => {
  const [showExportModal, setShowExportModal] = useState(false);

  const isMonth = view === 'dayGridMonth' || view === 'month';
  const isWeek = view === 'timeGridWeek' || view === 'week';
  const isDay = view === 'timeGridDay' || view === 'day';
  const isAgenda = view === 'listMonth' || view === 'agenda';

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-2 mb-3">
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

          <div className={`text-xs font-medium text-gray-200 capitalize truncate ${isChatOpen ? 'max-w-[110px] sm:max-w-[160px]' : 'max-w-[200px]'}`}>
            {label}
          </div>

          <MiniButton onClick={() => onNavigate('NEXT')} title="Siguiente" className="!px-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </MiniButton>
        </div>

        {/* Centro: vistas */}
        <div className="flex items-center gap-1 bg-gray-800/40 p-1 rounded-md border border-gray-700/50">
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

        {/* Derecha: export */}
        <MiniButton onClick={() => setShowExportModal(true)} title="Exportar calendario" className="!py-1.5">
          <span className="sr-only">Exportar</span>
          <ArrowDownTrayIcon className="w-4 h-4" />
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
