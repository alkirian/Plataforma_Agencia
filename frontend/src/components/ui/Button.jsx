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
  ...props
}) => {
  const variants = {
    primary: cyber
      ? 'btn-cyber bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-100 border-primary-500/40'
      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25',
    secondary: cyber
      ? 'btn-cyber bg-rambla-surface/50 text-rambla-text-primary border-rambla-border hover:border-primary-500/30'
      : 'bg-surface-800 text-surface-100 hover:bg-surface-700 border border-surface-700',
    ghost: cyber
      ? 'bg-transparent text-rambla-text-secondary hover:text-primary-400 hover:bg-primary-500/5 border border-transparent hover:border-primary-500/20'
      : 'bg-transparent text-surface-300 hover:bg-surface-800/50 hover:text-surface-100',
    danger: cyber
      ? 'btn-cyber bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-100 border-red-500/40'
      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
    success: cyber
      ? 'btn-cyber bg-gradient-to-r from-success/20 to-success/30 text-green-100 border-success/40'
      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 rounded-xl',
    lg: 'px-7 py-3 text-lg rounded-xl',
    xl: 'px-8 py-4 text-xl rounded-2xl',
  };

  const handleClick = e => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <motion.button
      whileHover={{
        scale: disabled ? 1 : 1.02,
        boxShadow: !disabled && cyber ? '0 0 25px -5px rgba(0, 246, 255, 0.4)' : undefined,
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-rambla-bg',
        !cyber && 'btn-modern',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
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
