import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Card = ({
  children,
  className,
  hover = true,
  animate = true,
  delay = 0,
  cyber = true,
  ...props
}) => {
  const cardContent = (
    <div
      className={cn(
        cyber ? 'card-cyber' : 'card p-6',
        'transition-all duration-300 focus-visible:focus-visible',
        hover && 'hover-cyber-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.4,
          delay,
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
  whileHover={{ scale: hover ? 1.01 : 1 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export const CardHeader = ({ children, className, cyber = true, ...props }) => (
  <div
    className={cn(
  'mb-6 pb-4',
  cyber ? 'border-b border-[color:var(--color-border-subtle)]' : 'border-b border-[color:var(--color-border-subtle)]',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className, cyber = true, ...props }) => (
  <motion.h3
    className={cn(
  'text-lg font-semibold',
      cyber ? 'text-cyber-gradient' : 'text-gradient',
      className
    )}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    {...props}
  >
    {children}
  </motion.h3>
);

export const CardContent = ({ children, className, ...props }) => (
  <motion.div
    className={cn('space-y-4', className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    {...props}
  >
    {children}
  </motion.div>
);

export const CardFooter = ({ children, className, cyber = true, ...props }) => (
  <div
    className={cn(
      'mt-6 pt-4',
      cyber ? 'border-t border-[color:var(--color-border-subtle)]' : 'border-t border-[color:var(--color-border-subtle)]',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const StatCard = ({
  title,
  value,
  subvalue,
  icon: Icon,
  trend,
  className,
  ...props
}) => (
  <Card className={cn('p-5 md:p-6 group', className)} {...props}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-text-muted">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-semibold text-text-primary">{value}</span>
          {subvalue && <span className="text-sm text-text-muted">{subvalue}</span>}
        </div>
      </div>
      {Icon && (
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-surface-soft border border-[color:var(--color-border-subtle)] shadow-glass">
          <Icon className="h-5 w-5 text-[var(--color-accent-blue)]" />
        </div>
      )}
    </div>
    {trend && (
      <div className="mt-3 text-xs text-text-muted">{trend}</div>
    )}
  </Card>
);
