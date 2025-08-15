// src/components/schedule/MiniMonth.jsx
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export const MiniMonth = ({ date, onNavigate, onSelectDate }) => {
  moment.locale('es');
  return (
    <div className="rounded-lg border border-white/10 bg-rambla-surface p-2">
      <Calendar
        localizer={localizer}
        date={date}
        view="month"
        toolbar={false}
        events={[]}
  selectable
  onNavigate={onNavigate}
  onSelectSlot={({ start }) => onSelectDate?.(start)}
        style={{ height: 300 }}
      />
    </div>
  );
};
