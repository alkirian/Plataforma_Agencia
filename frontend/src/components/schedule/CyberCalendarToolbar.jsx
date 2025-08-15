import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon,
  ClockIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

export const CyberCalendarToolbar = ({ label, onNavigate, view, onView }) => {
  const viewOptions = [
    { value: 'month', label: 'Mes', icon: CalendarDaysIcon },
    { value: 'week', label: 'Semana', icon: Squares2X2Icon },
    { value: 'day', label: 'Día', icon: ClockIcon },
    { value: 'agenda', label: 'Agenda', icon: ListBulletIcon },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Navegación */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 bg-gradient-to-r from-glow-cyan to-rambla-accent text-black 
                     font-semibold rounded-lg shadow-lg hover:shadow-glow-cyan/50
                     transition-all duration-300"
        >
          Hoy
        </motion.button>

        <div className="flex items-center bg-rambla-surface/50 rounded-lg border border-white/10 p-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('PREV')}
            className="p-1.5 hover:bg-white/10 rounded-md transition-all group"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-glow-cyan" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('NEXT')}
            className="p-1.5 hover:bg-white/10 rounded-md transition-all group"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-glow-cyan" />
          </motion.button>
        </div>
      </div>

      {/* Título del mes/semana actual */}
      <motion.h2 
        key={label}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-glow-cyan"
      >
        {label}
      </motion.h2>

      {/* Selector de vista */}
      <div className="flex items-center bg-rambla-surface/50 rounded-lg border border-white/10 p-1">
        {viewOptions.map(({ value, label, icon: Icon }) => (
          <motion.button
            key={value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView(value)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm
              transition-all duration-300
              ${view === value 
                ? 'bg-gradient-to-r from-glow-cyan to-rambla-accent text-black shadow-lg' 
                : 'text-gray-400 hover:text-glow-cyan hover:bg-white/5'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
