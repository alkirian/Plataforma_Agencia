import React, { useRef, useState } from 'react'
import {
  Sun,
  Moon,
  Terminal,
  Settings as SettingsIcon,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'
import { useTheme } from '@shared/hooks/useTheme'
import { useNavigate } from 'react-router-dom'
import { KeyboardShortcutsModal, Avatar } from '@shared/components/ui'
import { supabase } from '@/supabaseClient'

/**
 * Content component for user profile dropdown menu
 * Extracted from SettingsMenu to be used with SimpleDropdown
 */
export const UserProfileContent = ({ userEmail, profile, onClose }) => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const ThemeIcon = theme === 'light' ? Moon : Sun
  const themeLabel = theme === 'light' ? 'Tema Oscuro' : 'Tema Claro'

  const handlePickFile = () => fileRef.current?.click()

  const handleFileChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      alert('Formato no soportado. Usa PNG, JPG o WEBP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo supera 2MB. Reduce su tamaño.')
      return
    }
    setUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')
      const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = pub?.publicUrl
      if (!url) throw new Error('No se pudo obtener URL pública')
      const stamped = `${url}?v=${Date.now()}`
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ avatar_url: stamped })
        .eq('id', user.id)
      if (profErr) throw profErr
      setAvatarUrl(stamped)
      // Avisar a la app para refrescar el perfil global
      window.dispatchEvent(new CustomEvent('profile:refresh'))
      onClose()
    } catch (err) {
      console.error('Upload avatar error', err)
      alert('No se pudo subir el avatar. Verifica configuración de Supabase.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <div className='w-72'>
        {/* User Profile Section */}
        <div className='p-3 border-b border-[color:var(--color-border-subtle)]'>
          <div className='flex items-center gap-3'>
            <Avatar src={avatarUrl} name={userEmail} size={40} />
            <div className='min-w-0'>
              <div className='text-sm font-medium text-text-primary truncate'>{userEmail}</div>
              <button
                className='text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1'
                onClick={handlePickFile}
                disabled={uploading}
              >
                <ImageIcon className='h-3.5 w-3.5' /> {uploading ? 'Subiendo…' : 'Cambiar foto'}
              </button>
            </div>
          </div>
          <input
            ref={fileRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
          />
        </div>

        {/* Menu Options */}
        <div className='py-1'>
          <button
            className='w-full px-3 py-2.5 flex items-center gap-2 text-sm text-text-primary hover:bg-[color:var(--color-surface-soft)] transition-colors'
            onClick={() => {
              navigate('/settings')
              onClose()
            }}
            role='menuitem'
          >
            <SettingsIcon className='h-4 w-4' /> Configuración
          </button>

          <button
            className='w-full px-3 py-2.5 flex items-center justify-between text-sm text-text-primary hover:bg-[color:var(--color-surface-soft)] transition-colors'
            onClick={() => {
              setTheme(nextTheme)
              onClose()
            }}
            role='menuitem'
          >
            <span className='flex items-center gap-2'>
              <ThemeIcon className='h-4 w-4' /> {themeLabel}
            </span>
            <span className='text-xs text-text-secondary'>Cambiar</span>
          </button>

          <button
            className='w-full px-3 py-2.5 flex items-center justify-between text-sm text-text-primary hover:bg-[color:var(--color-surface-soft)] transition-colors'
            onClick={() => {
              setShortcutsOpen(true)
              onClose()
            }}
            role='menuitem'
          >
            <span className='flex items-center gap-2'>
              <Terminal className='h-4 w-4' /> Atajos de teclado
            </span>
            <ChevronRight className='h-4 w-4 text-text-secondary' />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  )
}
