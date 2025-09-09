import React, { useEffect, useMemo, useState } from 'react'
import {
  listMembersAndInvites,
  createInvitations,
  revokeInvitation,
  resendInvitation,
} from '../../api/invitations.api'
import { Button } from '../ui'

export const MembersPanel = () => {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState('member')
  const [submitting, setSubmitting] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await listMembersAndInvites()
      setMembers(res?.data?.members || [])
      setInvites(res?.data?.invitations || [])
    } catch (e) {
      console.error('Error fetching members/invites', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const pendingCount = invites.length

  const handleInvite = async e => {
    e.preventDefault()
    const list = emails
      .split(',')
      .map(x => x.trim())
      .filter(Boolean)
    if (list.length === 0) return
    setSubmitting(true)
    try {
      await createInvitations({ emails: list, role })
      setEmails('')
      await refresh()
    } catch (e) {
      console.error('Error creating invites', e)
      alert(e.message || 'No se pudieron crear invitaciones')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async id => {
    try {
      await revokeInvitation(id)
      await refresh()
    } catch (e) {
      alert('No se pudo revocar')
    }
  }

  const handleResend = async id => {
    try {
      await resendInvitation(id)
      alert('Invitación reenviada')
    } catch (e) {
      alert('No se pudo reenviar')
    }
  }

  return (
    <div className='rounded-xl border border-[color:var(--color-border-subtle)] bg-surface-strong p-6 shadow-lg space-y-6'>
      <div>
        <h2 className='text-xl font-semibold text-text-primary'>Miembros de la agencia</h2>
        <p className='mt-1 text-text-muted'>Gestiona miembros e invitaciones pendientes.</p>
      </div>

      <form onSubmit={handleInvite} className='space-y-3'>
        <div className='flex gap-2 flex-col sm:flex-row'>
          <input
            type='text'
            placeholder='Correos (separados por coma)'
            value={emails}
            onChange={e => setEmails(e.target.value)}
            className='flex-1 rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary'
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className='rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary'
          >
            <option value='member'>Miembro</option>
            <option value='admin'>Admin</option>
          </select>
          <Button type='submit' disabled={submitting}>
            {submitting ? 'Invitando…' : 'Invitar'}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className='text-text-muted'>Cargando…</div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h3 className='font-medium text-text-primary mb-2'>Miembros</h3>
            <ul className='divide-y divide-[color:var(--color-border-subtle)]'>
              {members.map(m => (
                <li key={m.id} className='py-2 flex items-center justify-between'>
                  <div>
                    <div className='text-text-primary font-medium'>{m.full_name || m.email}</div>
                    <div className='text-xs text-text-muted'>{m.email}</div>
                  </div>
                  <span className='text-xs rounded bg-surface-soft px-2 py-1 border border-[color:var(--color-border-subtle)]'>
                    {m.role || 'member'}
                  </span>
                </li>
              ))}
              {members.length === 0 && <li className='py-2 text-text-muted'>Sin miembros</li>}
            </ul>
          </div>
          <div>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='font-medium text-text-primary'>Invitaciones pendientes</h3>
              <span className='text-xs text-text-muted'>{pendingCount}</span>
            </div>
            <ul className='divide-y divide-[color:var(--color-border-subtle)]'>
              {invites.map(i => (
                <li key={i.id} className='py-2'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-text-primary font-medium'>{i.email}</div>
                      <div className='text-xs text-text-muted'>
                        rol: {i.role} • expira: {new Date(i.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button size='sm' variant='secondary' onClick={() => handleResend(i.id)}>
                        Reenviar
                      </Button>
                      <Button size='sm' variant='secondary' onClick={() => handleRevoke(i.id)}>
                        Revocar
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
              {invites.length === 0 && <li className='py-2 text-text-muted'>Sin invitaciones</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
