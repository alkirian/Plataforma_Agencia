import React, { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Modal } from '@components/ui/Modal'
import { createInvitations } from '@api/invitations'
import toast from 'react-hot-toast'

export const InviteUserModal = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState('member')
  const [submitting, setSubmitting] = useState(false)

  const handleInvite = async () => {
    const list = emails
      .split(',')
      .map(x => x.trim())
      .filter(Boolean)

    if (list.length === 0) {
      toast.error('Por favor ingresa al menos un email')
      return
    }

    setSubmitting(true)
    try {
      await toast.promise(
        createInvitations({
          emails: list,
          role,
          redirectUrl: `${window.location.origin}/invite-accept`,
        }),
        {
          loading: 'Enviando invitaciones...',
          success: 'Invitaciones enviadas exitosamente',
          error: 'Error al enviar las invitaciones',
        }
      )
      setEmails('')
      setRole('member')
      onClose()
    } catch (e) {
      console.error('Error creating invites', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setEmails('')
      setRole('member')
      onClose()
    }
  }

  // Modal actions
  const actions = [
    {
      id: 'cancel',
      label: 'Cancelar',
      variant: 'ghost',
      onClick: handleClose,
      disabled: submitting,
    },
    {
      id: 'invite',
      label: submitting ? 'Enviando...' : 'Enviar Invitaciones',
      variant: 'primary',
      onClick: handleInvite,
      disabled: submitting || !emails.trim(),
      loading: submitting,
    },
  ]

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title='Invitar Usuarios'
      description='Invita nuevos miembros a tu agencia'
      icon={<UserPlus className='h-6 w-6 text-primary-400' />}
      size='md'
      actions={actions}
      closeOnBackdrop={!submitting}
    >

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-text-primary mb-2'>Emails</label>
          <input
            type='text'
            placeholder='email1@ejemplo.com, email2@ejemplo.com'
            value={emails}
            onChange={e => setEmails(e.target.value)}
            className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)] focus:border-transparent'
            disabled={submitting}
            autoFocus
          />
          <p className='text-xs text-text-muted mt-1'>Separa múltiples emails con comas</p>
        </div>

        <div>
          <label className='block text-sm font-medium text-text-primary mb-2'>Rol</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)] focus:border-transparent'
            disabled={submitting}
          >
            <option value='member'>Miembro</option>
            <option value='admin'>Administrador</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}
