import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  loading = false,
  icon,
  cyber = true,
  onClick,
  'aria-label': ariaLabel,
  ...props
}) => {
  const variants = {
    primary: cyber
      ? 'btn-cyber bg-[#0ea5e9] text-white border-transparent hover:bg-[#0284c7] shadow-[0_4px_14px_rgba(14,165,233,0.25)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.35)]'
      : 'bg-[#0ea5e9] text-white hover:bg-[#0284c7] shadow-lg shadow-sky-500/25',
    secondary: cyber
      ? 'btn-cyber bg-[#38bdf8] text-white border-transparent hover:bg-[#0ea5e9] shadow-[0_4px_14px_rgba(56,189,248,0.15)] hover:shadow-[0_6px_20px_rgba(56,189,248,0.25)]'
      : 'bg-[#38bdf8] text-white hover:bg-[#0ea5e9] border border-transparent shadow-md',
    ghost: cyber
      ? 'bg-transparent text-text-muted hover:text-text-primary hover:bg-[rgba(14,165,233,0.08)] border border-transparent hover:border-[color:var(--color-border-subtle)]'
      : 'bg-transparent text-surface-300 hover:bg-surface-800/50 hover:text-surface-100',
    danger: cyber
      ? 'btn-cyber bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-100 border-red-500/40'
      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
    success: cyber
      ? 'btn-cyber bg-gradient-to-r from-[#0ea5e9]/20 to-[#0284c7]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 border-[#0ea5e9]/40'
      : 'bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg min-h-[44px] sm:min-h-auto sm:px-3 sm:py-1.5',
    md: 'px-6 py-3 rounded-xl min-h-[44px] sm:min-h-auto sm:px-5 sm:py-2.5',
    lg: 'px-8 py-4 text-lg rounded-xl min-h-[48px] sm:min-h-auto sm:px-7 sm:py-3',
    xl: 'px-10 py-5 text-xl rounded-2xl min-h-[52px] sm:min-h-auto sm:px-8 sm:py-4',
  };

  const handleClick = e => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <motion.button
      whileHover={{
        scale: disabled ? 1 : 1.02,
        boxShadow: !disabled && cyber ? '0 0 25px -5px rgba(96,165,250,0.3)' : undefined,
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/50 focus:ring-offset-2 focus:ring-offset-[color:var(--color-app-bg)]',
        !cyber && 'btn-modern',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel || (loading ? 'Cargando...' : undefined)}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <motion.div
          className='w-4 h-4 border-2 border-current border-t-transparent rounded-full'
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : icon ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};

// Variante especializada
export const CyberButton = props => <Button {...props} cyber={true} />;
