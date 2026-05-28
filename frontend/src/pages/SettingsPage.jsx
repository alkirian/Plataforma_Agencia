import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CommandLineIcon,
  UserGroupIcon,
  UserIcon,
  PaintBrushIcon,
  LanguageIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { KeyboardShortcutsModal } from '../components/ui/KeyboardShortcutsModal';
import { CadenceLogosPreview } from '../components/ui/CadenceLogosPreview';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

// Importación de submódulos y constantes refactoreadas
import { translations } from '../constants/settingsTranslations';
import { sqlAvatarSetup } from '../constants/settingsSqlTemplates';
import { ProfileTab } from '../components/settings/ProfileTab';
import { AppearanceTab } from '../components/settings/AppearanceTab';
import { LanguageTab } from '../components/settings/LanguageTab';
import { ShortcutsTab } from '../components/settings/ShortcutsTab';
import { TeamTab } from '../components/settings/TeamTab';
import { AvatarCropperModal } from '../components/settings/AvatarCropperModal';

export const SettingsPage = ({ profile, session, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);

  // Idioma
  const [lang, setLang] = useState(() => localStorage.getItem('cadence-lang') || 'es');
  const t = translations[lang];

  // Tema
  const [theme, setTheme] = useState(() => localStorage.getItem('cadence-theme') || 'dark');

  // Datos de Perfil
  const [fullName, setFullName] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarColMissing, setAvatarColMissing] = useState(false);

  // Estados para el Recortador de Avatar Circular
  const [showCropper, setShowCropper] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');

  // Inicializar Datos del Perfil
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || profile.full_name || '');
      const cachedAvatar = localStorage.getItem(`cadence-avatar-${profile.id}`);
      setAvatarBase64(profile.avatar_url || cachedAvatar || '');
    }
  }, [profile]);

  // Sincronizar Tema
  const handleThemeChange = nextTheme => {
    setTheme(nextTheme);
    localStorage.setItem('cadence-theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.add('dark');
    }
    toast.success(nextTheme === 'light' ? 'Modo Claro activado' : 'Modo Oscuro activado');
  };

  // Sincronizar Idioma
  const handleLangChange = nextLang => {
    setLang(nextLang);
    localStorage.setItem('cadence-lang', nextLang);
    toast.success(nextLang === 'es' ? 'Idioma cambiado a Español' : 'Language set to English');
  };

  // Cerrar y limpiar el recortador (liberando memoria)
  const closeCropper = () => {
    if (rawImageSrc && rawImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(rawImageSrc);
    }
    setShowCropper(false);
    setRawImageSrc('');
  };

  // Callback al seleccionar archivo para recortar
  const handleAvatarFileSelect = file => {
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setShowCropper(true);
  };

  // Guardar recorte optimizado
  const handleCropSave = compressedBase64 => {
    setAvatarBase64(compressedBase64);
    closeCropper();
    toast.success(
      lang === 'es'
        ? 'Foto de perfil recortada y optimizada'
        : 'Profile photo cropped and optimized'
    );
  };

  // Guardar Datos del Perfil (Híbrido DB + LocalStorage fallback)
  const handleSaveProfile = async e => {
    e.preventDefault();
    if (!profile) return;

    setSavingProfile(true);

    try {
      // 1) Guardar en localStorage siempre como respaldo local
      if (avatarBase64) {
        localStorage.setItem(`cadence-avatar-${profile.id}`, avatarBase64);
      }

      // 2) Guardar en base de datos
      const updateData = {
        full_name: fullName.trim(),
      };

      if (avatarBase64) {
        updateData.avatar_url = avatarBase64;
      }

      const { error } = await supabase.from('profiles').update(updateData).eq('id', profile.id);

      if (error) {
        if (
          error.message?.includes('avatar_url') ||
          error.code === 'P0002' ||
          error.message?.includes('does not exist')
        ) {
          setAvatarColMissing(true);

          // Guardar solo el nombre completo en la DB
          const { error: nameOnlyError } = await supabase
            .from('profiles')
            .update({ full_name: fullName.trim() })
            .eq('id', profile.id);

          if (nameOnlyError) throw nameOnlyError;

          toast.success(t.profile.success + ' (Local fallback active)');
        } else {
          throw error;
        }
      } else {
        setAvatarColMissing(false);
        toast.success(t.profile.success);
      }

      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      console.error(err);
      toast.error(t.profile.error);
    } finally {
      setSavingProfile(false);
    }
  };

  const copyToClipboard = code => {
    navigator.clipboard.writeText(code);
    toast.success('Copiado al portapapeles!');
  };

  // Listado de Tabs
  const menuItems = [
    { id: 'profile', label: t.tabs.profile, icon: UserIcon },
    { id: 'appearance', label: t.tabs.appearance, icon: PaintBrushIcon },
    { id: 'language', label: t.tabs.language, icon: LanguageIcon },
    { id: 'shortcuts', label: t.tabs.shortcuts, icon: CommandLineIcon },
    { id: 'team', label: t.tabs.team, icon: UserGroupIcon },
    { id: 'brand', label: t.tabs.brand, icon: SparklesIcon },
  ];

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3'>
          {t.title}
        </h1>
        <p className='text-text-muted text-sm mt-1'>{t.subtitle}</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {/* Navegación Lateral (Tabs) */}
        <div className='md:col-span-1 space-y-2'>
          <div className='flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1 md:gap-1.5 scrollbar-none'>
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 flex-shrink-0 md:flex-shrink w-auto md:w-full border ${
                    isActive
                      ? 'bg-surface border-border-strong text-text-primary shadow-sm'
                      : 'border-transparent text-text-muted hover:bg-surface-soft hover:text-text-primary'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isActive ? 'text-text-primary' : 'text-text-muted'}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Contenido Principal */}
        <div className='md:col-span-3'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <ProfileTab
                  profile={profile}
                  fullName={fullName}
                  setFullName={setFullName}
                  avatarBase64={avatarBase64}
                  setAvatarBase64={setAvatarBase64}
                  savingProfile={savingProfile}
                  avatarColMissing={avatarColMissing}
                  handleSaveProfile={handleSaveProfile}
                  onAvatarFileSelect={handleAvatarFileSelect}
                  copyToClipboard={copyToClipboard}
                  sqlAvatarSetup={sqlAvatarSetup}
                  t={t}
                />
              )}

              {activeTab === 'appearance' && (
                <AppearanceTab
                  theme={theme}
                  handleThemeChange={handleThemeChange}
                  t={t}
                />
              )}

              {activeTab === 'language' && (
                <LanguageTab
                  lang={lang}
                  handleLangChange={handleLangChange}
                  t={t}
                />
              )}

              {activeTab === 'shortcuts' && (
                <ShortcutsTab
                  setIsKeyboardModalOpen={setIsKeyboardModalOpen}
                  t={t}
                  lang={lang}
                />
              )}

              {activeTab === 'team' && (
                <TeamTab
                  profile={profile}
                  session={session}
                  t={t}
                  lang={lang}
                />
              )}

              {activeTab === 'brand' && (
                <CadenceLogosPreview />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <KeyboardShortcutsModal
        isOpen={isKeyboardModalOpen}
        onClose={() => setIsKeyboardModalOpen(false)}
      />

      <AnimatePresence>
        {showCropper && (
          <AvatarCropperModal
            rawImageSrc={rawImageSrc}
            onClose={closeCropper}
            onCropSave={handleCropSave}
            t={t.profile}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
