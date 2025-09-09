import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Sun, Moon } from 'lucide-react'
import { KeyboardShortcutsModal } from '../components/ui/KeyboardShortcutsModal'
import { CyberButton, Button } from '../components/ui/Button'
import { useTheme } from '@shared/hooks/useTheme'
import { Avatar } from '../components/ui/Avatar'
import { MembersPanel } from '../components/settings/MembersPanel.jsx'
import { supabase } from '../supabaseClient'

export const SettingsPage = () => {
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        if (!error && data?.avatar_url) setAvatarUrl(data.avatar_url)
      } catch {}
    })()
  }, [])

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
    } catch (err) {
      console.error('Upload avatar error', err)
      alert('No se pudo subir el avatar. Verifica configuración de Supabase.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold text-text-primary'>Configuración</h1>

      {/* Apariencia */}
      <div className='rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
        <h2 className='text-xl font-semibold text-text-primary'>Apariencia</h2>
        <p className='mt-2 text-rambla-text-secondary'>Elige entre tema claro u oscuro.</p>
        <div className='mt-4 flex items-center gap-3'>
          <Button
            variant={theme === 'light' ? 'primary' : 'secondary'}
            size='md'
            onClick={() => setTheme('light')}
            aria-label='Activar tema claro'
          >
            <Sun className='h-4 w-4' /> Tema Claro
          </Button>
          <Button
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            size='md'
            onClick={() => setTheme('dark')}
            aria-label='Activar tema oscuro'
          >
            <Moon className='h-4 w-4' /> Tema Oscuro
          </Button>
        </div>
      </div>

      {/* Avatar */}
      <div className='rounded-xl border border-[color:var(--color-border-subtle)] bg-surface-strong p-6 shadow-lg'>
        <h2 className='text-xl font-semibold text-text-primary'>Foto de perfil</h2>
        <p className='mt-2 text-text-muted'>
          Sube o actualiza tu avatar. Tamaño recomendado 256x256px, máx 2MB.
        </p>
        <div className='mt-4 flex items-center gap-4'>
          <Avatar src={avatarUrl} name={'Usuario'} size={64} />
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label='Seleccionar foto'
            >
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
            </Button>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* Perfil de Usuario */}
      <div className='rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
        <h2 className='text-xl font-semibold text-text-primary'>Perfil de Usuario</h2>
        <p className='mt-2 text-rambla-text-secondary'>
          Próximamente: Aquí podrás editar tu nombre y otros detalles de tu perfil.
        </p>
      </div>

      {/* Atajos de Teclado */}
      <div className='rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-text-primary flex items-center gap-3'>
              <Terminal className='h-6 w-6 text-primary-400' />
              Atajos de Teclado
            </h2>
            <p className='mt-2 text-rambla-text-secondary'>
              Consulta y aprende todos los atajos de teclado disponibles para navegar más
              rápidamente.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <CyberButton
              onClick={() => setIsKeyboardModalOpen(true)}
              className='bg-primary-600 hover:bg-primary-700'
            >
              <Terminal className='h-4 w-4' />
              Ver Atajos
            </CyberButton>
          </motion.div>
        </div>
      </div>

      {/* Gestión de la Agencia */}
      <MembersPanel />

      {/* Modal de Atajos de Teclado */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardModalOpen}
        onClose={() => setIsKeyboardModalOpen(false)}
      />
    </div>
  )
}
