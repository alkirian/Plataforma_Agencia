import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  listClientContacts,
  upsertClientContacts,
  deleteClientContact,
  updateClientMeta,
} from '../../api/clients.js'
import { Globe, Linkedin, Instagram, Facebook, Twitter, Youtube, Phone, Music2 } from 'lucide-react'

const IconLink = ({ icon: Icon, label, url }) => {
  if (!url) return null
  return (
    <a
      href={url}
      target='_blank'
      rel='noreferrer'
      className='inline-flex items-center gap-2 text-text-primary hover:text-[color:var(--color-accent-blue)] transition-colors'
      aria-label={label}
      title={label}
    >
      <Icon className='h-4 w-4' />
      <span className='sr-only'>{label}</span>
    </a>
  )
}

export const ClientFooterInfo = ({ client, onClientUpdated }) => {
  const clientId = client?.id
  const [contacts, setContacts] = useState([])
  const [initialContacts, setInitialContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [website, setWebsite] = useState(client?.website || '')
  const [socials, setSocials] = useState(client?.social_links || {})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!clientId) return
        const res = await listClientContacts(clientId)
        const list = res?.data || []
        if (mounted) {
          setContacts(list)
          setInitialContacts(list)
          setWebsite(client?.website || '')
          setSocials(client?.social_links || {})
        }
      } catch {
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [clientId])

  const hasLinks = useMemo(
    () => Boolean(website || Object.values(socials || {}).some(Boolean)),
    [website, socials]
  )
  const hasContacts = (contacts || []).length > 0

  const normalizeUrl = val => {
    if (!val) return ''
    let v = String(val).trim()
    if (!v) return ''
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v
    return v
  }

  const handleSave = async () => {
    try {
      const payloadSocials = Object.fromEntries(
        Object.entries(socials || {}).map(([k, v]) => [k, normalizeUrl(v)])
      )
      await updateClientMeta(clientId, {
        website: normalizeUrl(website),
        social_links: payloadSocials,
      })

      const removed = (initialContacts || []).filter(
        ic => ic.id && !(contacts || []).some(c => c.id === ic.id)
      )
      if (contacts.length) await upsertClientContacts(clientId, contacts)
      for (const r of removed) {
        try {
          await deleteClientContact(clientId, r.id)
        } catch {}
      }

      toast.success('Información actualizada')
      setEditMode(false)
      onClientUpdated?.()
    } catch (e) {
      toast.error(e.message || 'No se pudo guardar')
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setWebsite(client?.website || '')
    setSocials(client?.social_links || {})
    setContacts(initialContacts || [])
  }

  if (!editMode && !hasLinks && !hasContacts) {
    return (
      <div className='mt-8 border-t border-[color:var(--color-border-subtle)] pt-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-text-primary'>Información</h3>
          <button
            onClick={() => setEditMode(true)}
            className='text-sm text-[color:var(--color-accent-blue)] hover:underline'
          >
            Editar
          </button>
        </div>
        <p className='text-sm text-text-muted mt-2'>
          Sin enlaces ni contactos. Pulsa “Editar” para agregar.
        </p>
      </div>
    )
  }

  return (
    <div className='mt-8 border-t border-[color:var(--color-border-subtle)] pt-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-text-primary'>Información</h3>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className='text-sm text-[color:var(--color-accent-blue)] hover:underline'
          >
            Editar
          </button>
        )}
      </div>

      {!editMode && hasLinks && (
        <div className='mb-4'>
          <h4 className='text-xs text-text-muted mb-2'>Enlaces</h4>
          <div className='flex flex-wrap gap-4 items-center'>
            {website && <IconLink icon={Globe} label='Sitio web' url={website} />}
            {socials.linkedin && (
              <IconLink icon={Linkedin} label='LinkedIn' url={socials.linkedin} />
            )}
            {socials.instagram && (
              <IconLink icon={Instagram} label='Instagram' url={socials.instagram} />
            )}
            {socials.facebook && (
              <IconLink icon={Facebook} label='Facebook' url={socials.facebook} />
            )}
            {socials.x && <IconLink icon={Twitter} label='X' url={socials.x} />}
            {socials.youtube && <IconLink icon={Youtube} label='YouTube' url={socials.youtube} />}
            {socials.tiktok && <IconLink icon={Music2} label='TikTok' url={socials.tiktok} />}
            {/* WhatsApp: podría mostrar un ícono Phone si hay phone/wa.me */}
          </div>
        </div>
      )}

      {editMode && (
        <div className='mb-6 space-y-3'>
          <h4 className='text-xs text-text-muted'>Enlaces</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder='https://www.miweb.com'
              className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'
            />
            {['linkedin', 'instagram', 'facebook', 'x', 'youtube', 'tiktok', 'whatsapp'].map(
              key => (
                <input
                  key={key}
                  value={socials?.[key] || ''}
                  onChange={e => setSocials({ ...socials, [key]: e.target.value })}
                  placeholder={`URL de ${key}`}
                  className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'
                />
              )
            )}
          </div>
        </div>
      )}

      {!editMode && hasContacts && (
        <div className='mb-2'>
          <h4 className='text-xs text-text-muted mb-2'>Contactos</h4>
          <ul className='space-y-2'>
            {contacts.map(c => (
              <li key={c.id} className='text-sm text-text-primary'>
                <div className='flex flex-wrap gap-2 items-center'>
                  <span className='font-medium'>{c.name || 'Contacto'}</span>
                  {c.role && <span className='text-text-muted'>• {c.role}</span>}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className='text-[color:var(--color-accent-blue)] hover:underline'
                    >
                      {c.email}
                    </a>
                  )}
                  {c.phone && <span className='text-text-muted'>{c.phone}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editMode && (
        <div className='space-y-3'>
          <h4 className='text-xs text-text-muted'>Contactos</h4>
          {(contacts || []).map((c, idx) => (
            <div key={c.id || idx} className='grid grid-cols-1 md:grid-cols-4 gap-2'>
              <input
                value={c.name || ''}
                onChange={e => updateContact(idx, 'name', e.target.value)}
                placeholder='Nombre'
                className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'
              />
              <input
                value={c.email || ''}
                onChange={e => updateContact(idx, 'email', e.target.value)}
                placeholder='Email'
                className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'
              />
              <input
                value={c.phone || ''}
                onChange={e => updateContact(idx, 'phone', e.target.value)}
                placeholder='Teléfono'
                className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'
              />
              <div className='flex gap-2 md:flex-row flex-col'>
                <input
                  value={c.role || ''}
                  onChange={e => updateContact(idx, 'role', e.target.value)}
                  placeholder='Rol'
                  className='w-full rounded-md border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary'
                />
                <button
                  type='button'
                  onClick={() => removeContact(idx)}
                  className='shrink-0 rounded-md border border-border-subtle px-3 py-2 text-sm text-text-muted hover:border-red-500 hover:text-red-400'
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          <button
            type='button'
            onClick={addContact}
            className='rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary hover:border-rambla-accent'
          >
            + Añadir contacto
          </button>
          <div className='flex justify-end gap-2 pt-2'>
            <button
              onClick={handleCancel}
              className='rounded-md border border-border-subtle px-4 py-2 text-sm text-text-muted hover:border-rambla-accent'
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className='rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90'
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function addContact() {
    setContacts([...(contacts || []), { name: '', email: '', phone: '', role: '' }])
  }
  function removeContact(idx) {
    setContacts((contacts || []).filter((_, i) => i !== idx))
  }
  function updateContact(idx, key, val) {
    const next = (contacts || []).slice()
    next[idx] = { ...next[idx], [key]: val }
    setContacts(next)
  }
}
