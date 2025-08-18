import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export const Tooltip = ({
  children,
  content,
  side = 'top',
  align = 'center',
  className,
  disabled = false,
  delay = 300,
  maxWidth = 'max-w-xs'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipElement = tooltipRef.current;
    
    if (!tooltipElement) return;

    const tooltipRect = tooltipElement.getBoundingClientRect();
    const spacing = 8;

    let x = 0;
    let y = 0;

    // Calculate base position based on side
    switch (side) {
      case 'top':
        x = triggerRect.left + (triggerRect.width / 2);
        y = triggerRect.top - spacing;
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width / 2);
        y = triggerRect.bottom + spacing;
        break;
      case 'left':
        x = triggerRect.left - spacing;
        y = triggerRect.top + (triggerRect.height / 2);
        break;
      case 'right':
        x = triggerRect.right + spacing;
        y = triggerRect.top + (triggerRect.height / 2);
        break;
    }

    // Adjust based on alignment
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          x = triggerRect.left;
          break;
        case 'end':
          x = triggerRect.right;
          break;
        case 'center':
        default:
          x = x - (tooltipRect.width / 2);
          break;
      }
      
      if (side === 'top') {
        y = y - tooltipRect.height;
      }
    } else {
      switch (align) {
        case 'start':
          y = triggerRect.top;
          break;
        case 'end':
          y = triggerRect.bottom;
          break;
        case 'center':
        default:
          y = y - (tooltipRect.height / 2);
          break;
      }
      
      if (side === 'left') {
        x = x - tooltipRect.width;
      }
    }

    // Keep tooltip within viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    x = Math.max(spacing, Math.min(x, viewport.width - tooltipRect.width - spacing));
    y = Math.max(spacing, Math.min(y, viewport.height - tooltipRect.height - spacing));

    setPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      
      const handleResize = () => updatePosition();
      const handleScroll = () => hideTooltip();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isVisible]);

  const getAnimationProps = () => {
    const baseProps = {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.2, ease: 'easeOut' }
    };

    switch (side) {
      case 'top':
        return { ...baseProps, initial: { ...baseProps.initial, y: 10 } };
      case 'bottom':
        return { ...baseProps, initial: { ...baseProps.initial, y: -10 } };
      case 'left':
        return { ...baseProps, initial: { ...baseProps.initial, x: 10 } };
      case 'right':
        return { ...baseProps, initial: { ...baseProps.initial, x: -10 } };
      default:
        return baseProps;
    }
  };

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none',
            maxWidth,
            className
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
          {...getAnimationProps()}
          role="tooltip"
        >
          {content}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 rotate-45',
              {
                'bottom-[-4px] left-1/2 transform -translate-x-1/2': side === 'top',
                'top-[-4px] left-1/2 transform -translate-x-1/2': side === 'bottom',
                'right-[-4px] top-1/2 transform -translate-y-1/2': side === 'left',
                'left-[-4px] top-1/2 transform -translate-y-1/2': side === 'right',
              }
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {createPortal(tooltipContent, document.body)}
    </>
  );
};

// Convenience wrapper for help tooltips
export const HelpTooltip = ({ content, children, ...props }) => (
  <Tooltip
    content={content}
    side="top"
    maxWidth="max-w-sm"
    {...props}
  >
    {children || (
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-gray-600 text-white rounded-full cursor-help">
        ?
      </span>
    )}
  </Tooltip>
);

// Wrapper for keyboard shortcut hints
export const ShortcutTooltip = ({ shortcut, description, children, ...props }) => (
  <Tooltip
    content={
      <div className="space-y-1">
        <div>{description}</div>
        <div className="text-xs text-gray-300">
          Atajo: <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">{shortcut}</kbd>
        </div>
      </div>
    }
    maxWidth="max-w-sm"
    {...props}
  >
    {children}
  </Tooltip>
);