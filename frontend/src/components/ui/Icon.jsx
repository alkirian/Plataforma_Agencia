import React from 'react';
import { cn } from '../../lib/utils';

export const Icon = ({ icon: IconCmp, size = 20, className, ...props }) => {
  if (!IconCmp) return null;
  return <IconCmp size={size} className={cn('text-text-muted', className)} {...props} />;
};

