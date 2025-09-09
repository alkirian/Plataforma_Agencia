import React from 'react'
import { MessageSquare } from 'lucide-react'

export const AIAssistantLauncher = ({ open, onToggle }) => {
  return (
    <button
      type='button'
      onClick={onToggle}
      aria-label={open ? 'Ocultar asistente IA' : 'Abrir asistente IA'}
      aria-pressed={open}
      className='fixed right-4 bottom-4 z-[60] h-12 w-12 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)] text-text-primary shadow-xl hover:shadow-2xl transition-all'
      title='Asistente IA'
    >
      <MessageSquare className='h-6 w-6 mx-auto' aria-hidden='true' />
    </button>
  )
}

export default AIAssistantLauncher
