import React, { useCallback, type ChangeEvent } from 'react'
import { Button } from '../ui/Button'
import type { Contact } from '../../../shared/types'

/**
 * ContactsEditor Component
 * SCOPE: Used only by ClientCreationModal (single usage) - stays local to dashboard
 * PERFORMANCE: Optimized with memoization and granular contact components
 *
 * Manages dynamic list of client contacts with add/remove functionality
 */
interface ContactsEditorProps {
  value?: Contact[]
  onChange?: (contacts: Contact[]) => void
}

export const ContactsEditor = React.memo<ContactsEditorProps>(({ value = [], onChange }) => {
  const items = value || []

  const addContact = useCallback(() => {
    onChange?.([...items, { name: '', email: '', phone: '', position: '' }])
  }, [items, onChange])

  const removeContact = useCallback(
    (index: number) => {
      onChange?.(items.filter((_, i) => i !== index))
    },
    [items, onChange]
  )

  const updateContact = useCallback(
    (index: number, key: keyof Contact, val: string) => {
      const next = items.slice()
      next[index] = { ...next[index], [key]: val }
      onChange?.(next)
    },
    [items, onChange]
  )

  const baseInputClassName =
    'rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-accent-blue)] focus:outline-none transition-colors'

  return (
    <div className='space-y-3'>
      {items.map((contact, index) => (
        <ContactRow
          key={index}
          contact={contact}
          index={index}
          onUpdate={updateContact}
          onRemove={removeContact}
        />
      ))}
      <Button
        variant='ghost'
        size='sm'
        onClick={addContact}
        className='text-text-primary hover:border-[color:var(--color-accent-blue)]'
      >
        + Añadir contacto
      </Button>
    </div>
  )
})

/**
 * Individual Contact Row Component
 * PERFORMANCE: Memoized to prevent re-renders when other contacts change
 */
interface ContactRowProps {
  contact: Contact
  index: number
  onUpdate: (index: number, key: keyof Contact, val: string) => void
  onRemove: (index: number) => void
}

const ContactRow = React.memo<ContactRowProps>(({ contact, index, onUpdate, onRemove }) => {
  const baseInputClassName =
    'rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-accent-blue)] focus:outline-none transition-colors'

  const handleRemove = useCallback(() => {
    onRemove(index)
  }, [index, onRemove])

  const handleNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUpdate(index, 'name', e.target.value)
    },
    [index, onUpdate]
  )

  const handleEmailChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUpdate(index, 'email', e.target.value)
    },
    [index, onUpdate]
  )

  const handlePhoneChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUpdate(index, 'phone', e.target.value)
    },
    [index, onUpdate]
  )

  const handlePositionChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUpdate(index, 'position', e.target.value)
    },
    [index, onUpdate]
  )

  return (
    <div className='grid grid-cols-1 sm:grid-cols-4 gap-2'>
      <input
        value={contact.name || ''}
        onChange={handleNameChange}
        placeholder='Nombre'
        className={baseInputClassName}
      />
      <input
        type='email'
        value={contact.email || ''}
        onChange={handleEmailChange}
        placeholder='Email'
        className={baseInputClassName}
      />
      <input
        type='tel'
        value={contact.phone || ''}
        onChange={handlePhoneChange}
        placeholder='Teléfono'
        className={baseInputClassName}
      />
      <div className='flex gap-2'>
        <input
          value={contact.position || ''}
          onChange={handlePositionChange}
          placeholder='Cargo'
          className={`flex-1 ${baseInputClassName}`}
        />
        <Button
          variant='ghost'
          size='sm'
          onClick={handleRemove}
          className='text-text-muted hover:text-red-400 hover:border-red-500'
        >
          Eliminar
        </Button>
      </div>
    </div>
  )
})

ContactsEditor.displayName = 'ContactsEditor'
ContactRow.displayName = 'ContactRow'

export default ContactsEditor
