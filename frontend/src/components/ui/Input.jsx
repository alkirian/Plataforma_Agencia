import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Input = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className,
  cyber = true,
  icon,
  error,
  label,
  required = false,
  disabled = false,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <motion.label 
          className={cn(
            "block text-sm font-medium",
            cyber ? "text-rambla-text-primary" : "text-surface-200",
            required && "after:content-['*'] after:text-red-400 after:ml-1"
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative group">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 z-10",
            cyber ? "text-primary-400" : "text-surface-400",
            "group-focus-within:text-primary-300 transition-colors duration-200"
          )}>
            {icon}
          </div>
        )}
        
        <motion.input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            cyber ? "input-cyber" : "input-modern",
            icon && "pl-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileFocus={{
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
          {...props}
        />
        
        {/* Efecto de glow en focus */}
        {cyber && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
      </div>
      
      {error && (
        <motion.p 
          className="text-sm text-red-400"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export const Textarea = ({
  placeholder = '',
  value,
  onChange,
  className,
  cyber = true,
  error,
  label,
  required = false,
  disabled = false,
  rows = 4,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <motion.label 
          className={cn(
            "block text-sm font-medium",
            cyber ? "text-rambla-text-primary" : "text-surface-200",
            required && "after:content-['*'] after:text-red-400 after:ml-1"
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative group">
        <motion.textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows={rows}
          className={cn(
            cyber ? "input-cyber resize-none" : "input-modern resize-none",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileFocus={{
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
          {...props}
        />
        
        {/* Efecto de glow en focus */}
        {cyber && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
      </div>
      
      {error && (
        <motion.p 
          className="text-sm text-red-400"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
