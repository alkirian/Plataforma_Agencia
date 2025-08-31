import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Terminal, Settings as SettingsIcon, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Link } from 'react-router-dom';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';
import { Tooltip } from '../ui/Tooltip';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export const SettingsMenu = ({ userEmail, profile }) => {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const ref = useClickOutside(() => setOpen(false), open);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.avatar_url]);

  const nextTheme = theme === 'light' ? 'dark' : 'light';
  const ThemeIcon = theme === 'light' ? Moon : Sun;
  const themeLabel = theme === 'light' ? 'Tema Oscuro' : 'Tema Claro';

  const handlePickFile = () => fileRef.current?.click();
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      alert('Formato no soportado. Usa PNG, JPG o WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo supera 2MB. Reduce su tamaño.');
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');
      const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = pub?.publicUrl;
      if (!url) throw new Error('No se pudo obtener URL pública');
      const stamped = `${url}?v=${Date.now()}`;
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ avatar_url: stamped })
        .eq('id', user.id);
      if (profErr) throw profErr;
      setAvatarUrl(stamped);
      // Avisar a la app para refrescar el perfil global
      window.dispatchEvent(new CustomEvent('profile:refresh'));
      setOpen(false);
    } catch (err) {
      console.error('Upload avatar error', err);
      alert('No se pudo subir el avatar. Verifica configuración de Supabase.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Tooltip content="Ajustes rápidos">
        <motion.button
          onClick={() => setOpen(v => !v)}
          className={`icon-btn ${open ? 'icon-btn--active' : ''}`}
          aria-haspopup="menu"
          aria-expanded={open}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SettingsIcon className='h-5 w-5' aria-hidden="true" />
        </motion.button>
      </Tooltip>

      <AnimatePresence>
        {open && (
          <motion.div
            key="settings-menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="menu"
            aria-label="Menú de configuración"
            className="absolute right-0 mt-2 w-72 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)] shadow-xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-[color:var(--color-border-subtle)]">
              <div className="flex items-center gap-3">
                <Avatar src={avatarUrl} name={userEmail} size={40} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{userEmail}</div>
                  <button
                    className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"
                    onClick={handlePickFile}
                    disabled={uploading}
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> {uploading ? 'Subiendo…' : 'Cambiar foto'}
                  </button>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <div className="py-1">
              <button
                className="w-full px-3 py-2.5 flex items-center gap-2 text-sm text-text-primary hover:bg-[color:var(--color-surface-soft)] transition-colors"
                onClick={() => { setOpen(false); navigate('/settings'); }}
                role="menuitem"
              >
                <SettingsIcon className='h-4 w-4' /> Configuración
              </button>

              <button
                className="w-full px-3 py-2.5 flex items-center justify-between text-sm text-text-primary hover:bg-[color:var(--color-surface-soft)] transition-colors"
                onClick={() => { setTheme(nextTheme); setOpen(false); }}
                role="menuitem"
              >
                <span className="flex items-center gap-2">
                  <ThemeIcon className="h-4 w-4" /> {themeLabel}
                </span>
                <span className="text-xs text-text-secondary">Cambiar</span>
              </button>

              <button
                className="w-full px-3 py-2.5 flex items-center justify-between text-sm text-text-primary hover:bg-[color:var(--color-surface-soft)] transition-colors"
                onClick={() => { setShortcutsOpen(true); setOpen(false); }}
                role="menuitem"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> Atajos de teclado
                </span>
                <ChevronRight className="h-4 w-4 text-text-secondary" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

export default SettingsMenu;
