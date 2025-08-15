// src/components/schedule/CalendarToolbar.jsx
import React from 'react';

export const CalendarToolbar = ({ label, onNavigate, onView, view }) => {
  const Button = ({ children, onClick, active }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md border transition-colors
      ${active ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2">
      <div className="flex items-center gap-2">
        <Button onClick={() => onNavigate('TODAY')}>Hoy</Button>
        <div className="flex items-center gap-1">
          <Button onClick={() => onNavigate('PREV')}>◀</Button>
          <div className="px-3 py-1.5 text-white/90 text-sm border border-white/10 rounded-md bg-white/5">
            {label}
          </div>
          <Button onClick={() => onNavigate('NEXT')}>▶</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => onView('month')} active={view === 'month'}>Mes</Button>
        <Button onClick={() => onView('week')} active={view === 'week'}>Semana</Button>
        <Button onClick={() => onView('day')} active={view === 'day'}>Día</Button>
        <Button onClick={() => onView('agenda')} active={view === 'agenda'}>Agenda</Button>
      </div>
    </div>
  );
};
