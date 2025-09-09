import React from 'react'
import { cn } from '@lib/utils'

function getInitials(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('')
}

export const Avatar = ({ src, name = '', size = 32, className }) => {
  const dimension = typeof size === 'number' ? `${size}px` : size
  const initials = getInitials(name)
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full overflow-hidden border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-primary',
        className
      )}
      style={{ width: dimension, height: dimension }}
      aria-label={name ? `Avatar de ${name}` : 'Avatar'}
    >
      {src ? (
        <img
          src={src}
          alt={name ? `Foto de ${name}` : 'Foto de usuario'}
          className='w-full h-full object-cover'
          referrerPolicy='no-referrer'
          loading='lazy'
        />
      ) : (
        <span className='text-xs font-semibold'>{initials}</span>
      )}
    </div>
  )
}
