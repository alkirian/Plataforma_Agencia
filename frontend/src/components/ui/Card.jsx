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
        cyber ? 'card-cyber' : 'card-modern p-6',
        'transition-all duration-300',
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
        whileHover={{ scale: hover ? 1.02 : 1 }}
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
      cyber ? 'border-b border-rambla-border/30' : 'border-b border-surface-800/50',
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
      cyber ? 'border-t border-rambla-border/30' : 'border-t border-surface-800/50',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
