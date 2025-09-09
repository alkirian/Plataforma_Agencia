import React, { useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'

export const Onboarding = ({ session, onProfileComplete }) => {
  const [step, setStep] = useState(1) // 1: Perfil, 2: Agencia
  const [loading, setLoading] = useState(false)

  // Perfil
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('') // opcional (no se envía aún)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  // Agencia
  const [agencyName, setAgencyName] = useState('')
  const [website, setWebsite] = useState('') // opcional (no se envía aún)

  // API base
  const API_URL = import.meta.env.VITE_API_BASE_URL

  const onPickFile = () => fileInputRef.current?.click()

  const onFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      alert('Formato no soportado. Usa PNG, JPG o WEBP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo supera 2MB. Máximo 2MB.')
      return
    }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async e => {
    e?.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      // 1) Completar perfil en backend (sin romper contrato actual)
      const res = await fetch(`${API_URL}/users/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fullName, agencyName, role, website }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Error al completar el perfil')

      // 2) Subir avatar si se seleccionó (no bloquea flujo si falla)
      if (avatarFile) {
        try {
          setUploadingAvatar(true)
          const userId = session?.user?.id
          const ext = avatarFile.type.includes('png')
            ? 'png'
            : avatarFile.type.includes('webp')
              ? 'webp'
              : 'jpg'
          const path = `${userId}/${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, avatarFile, { upsert: true, cacheControl: '3600' })
          if (upErr) throw upErr
          const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
          const url = pub?.publicUrl
          if (url) {
            const stamped = `${url}?v=${Date.now()}`
            await supabase.from('profiles').update({ avatar_url: stamped }).eq('id', userId)
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') console.error('Avatar upload failed:', err)
        } finally {
          setUploadingAvatar(false)
        }
      }

      onProfileComplete?.()
    } catch (err) {
      alert(err.message || 'No se pudo completar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen text-text-primary flex items-center justify-center p-6'>
      <div className='w-full max-w-xl card rounded-xl p-6'>
        <div className='flex items-center justify-between'>
          <h2 className='mb-1 text-2xl font-bold text-cyber-gradient'>Completa tu registro</h2>
          <button
            type='button'
            onClick={async () => {
              try {
                await supabase.auth.signOut()
              } finally {
                window.location.href = '/welcome'
              }
            }}
            className='text-sm text-text-muted hover:text-text-primary hover:bg-surface-soft border border-transparent hover:border-[color:var(--color-border-subtle)] rounded-lg px-3 py-1.5'
            aria-label='Cambiar correo e iniciar sesión con otro email'
            title='Cambiar correo'
          >
            Cambiar correo
          </button>
        </div>

        <p className='mb-6 text-sm text-text-muted'>
          Configura tu perfil y la información básica de tu agencia.
        </p>

        {/* Paso 1: Perfil */}
        {step === 1 && (
          <div className='space-y-6'>
            <div>
              <label className='mb-2 block text-sm text-text-muted'>
                Foto de perfil (opcional)
              </label>
              <div className='flex items-center gap-4'>
                <Avatar src={avatarUrl} name={fullName || session?.user?.email} size={64} />
                <div className='flex items-center gap-2'>
                  <Button type='button' onClick={onPickFile} size='sm'>
                    Elegir foto
                  </Button>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={onFileChange}
                  />
                  {avatarFile && (
                    <span className='text-xs text-text-muted'>Preparada para subir</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor='fullName' className='mb-1 block text-sm text-text-muted'>
                Tu nombre completo
              </label>
              <input
                id='fullName'
                type='text'
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none'
                required
              />
            </div>

            <div>
              <label htmlFor='role' className='mb-1 block text-sm text-text-muted'>
                Rol o puesto (opcional)
              </label>
              <input
                id='role'
                type='text'
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder='Ej.: Founder, CMO, Project Manager'
                className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none'
              />
            </div>

            <div className='flex items-center justify-end gap-3'>
              <Button type='button' onClick={() => setStep(2)} disabled={!fullName.trim()}>
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Paso 2: Agencia */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label htmlFor='agencyName' className='mb-1 block text-sm text-text-muted'>
                Nombre de tu agencia
              </label>
              <input
                id='agencyName'
                type='text'
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none'
                required
              />
            </div>

            <div>
              <label htmlFor='website' className='mb-1 block text-sm text-text-muted'>
                Sitio web (opcional)
              </label>
              <input
                id='website'
                type='url'
                inputMode='url'
                placeholder='https://tu-agencia.com'
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none'
              />
            </div>

            <div className='flex items-center justify-between gap-3'>
              <Button type='button' onClick={() => setStep(1)} variant='ghost'>
                Atrás
              </Button>
              <Button
                type='submit'
                disabled={loading || uploadingAvatar || !agencyName.trim()}
                loading={loading || uploadingAvatar}
              >
                {loading || uploadingAvatar ? 'Guardando…' : 'Finalizar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
