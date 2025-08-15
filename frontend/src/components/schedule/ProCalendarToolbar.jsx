import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

export const ProCalendarToolbar = ({ label, onNavigate, view, onView }) => {
  const viewOptions = [
    { value: 'day', label: 'Día', icon: ClockIcon },
    { value: 'week', label: 'Semana', icon: Squares2X2Icon },
    { value: 'month', label: 'Mes', icon: CalendarDaysIcon },
    { value: 'agenda', label: 'Año', icon: ListBulletIcon }, // usando agenda como placeholder
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-gray-100 
                     font-medium text-sm rounded-lg transition-all duration-200
                     min-h-[36px] flex items-center" // accessibility: min hit area
        >
          Hoy
        </motion.button>

        <div className="flex items-center bg-surface-800/50 rounded-lg border border-white/10 p-0.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('PREV')}
            className="p-2 hover:bg-white/10 rounded-md transition-all group min-h-[36px]"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-200" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('NEXT')}
            className="p-2 hover:bg-white/10 rounded-md transition-all group min-h-[36px]"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-200" />
          </motion.button>
        </div>
      </div>

      {/* Current period label */}
      <motion.h2 
        key={label}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-semibold text-gray-200"
      >
        {label}
      </motion.h2>

      {/* View selector - segmented control style */}
      <div className="flex items-center bg-surface-800/50 rounded-lg border border-white/10 p-1">
        {viewOptions.map(({ value, label, icon: Icon }) => (
          <motion.button
            key={value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onView(value)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm
              transition-all duration-200 min-h-[36px]
              ${view === value 
                ? 'bg-accent-600 text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/8'
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
