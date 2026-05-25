import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CommandLineIcon, 
  SparklesIcon,
  UserGroupIcon, 
  UserPlusIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon, 
  TrashIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  ClipboardIcon,
  UserIcon,
  PaintBrushIcon,
  LanguageIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { KeyboardShortcutsModal } from '../components/ui/KeyboardShortcutsModal';
import { CyberButton } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const translations = {
  es: {
    title: 'Configuración Global',
    subtitle: 'Administra tus preferencias personales de perfil, apariencia, idioma y equipo.',
    tabs: {
      profile: 'Mi Perfil',
      appearance: 'Apariencia',
      language: 'Idioma',
      shortcuts: 'Atajos de Teclado',
      team: 'Miembros del Equipo'
    },
    profile: {
      title: 'Datos de tu Perfil',
      desc: 'Actualiza tu nombre completo y sube una foto de avatar personalizada.',
      nameLabel: 'Nombre Completo',
      avatarLabel: 'Foto de Perfil / Avatar',
      roleLabel: 'Rol en la Agencia',
      saveBtn: 'Guardar Cambios',
      saving: 'Guardando...',
      success: '¡Perfil guardado correctamente!',
      error: 'Error al actualizar el perfil.',
      dragDrop: 'Arrastra una imagen aquí o haz clic para subir',
      noAvatar: 'Sin Foto de Perfil',
      dbTip: 'Tip de Sincronización',
      dbTipDesc: 'Para que tu equipo pueda ver tu avatar en tiempo real, ejecuta este comando en el editor SQL de Supabase:',
      dbApplied: 'El avatar se sincronizará con la base de datos.',
      dbLocalOnly: 'Nota: Guardado localmente en tu navegador. Ejecuta la query SQL de abajo para sincronizar con tu equipo.',
      userId: 'ID de Usuario',
      uploadBtn: 'Subir Foto',
      removeBtn: 'Quitar',
      cropperTitle: 'Ajustar Foto de Perfil',
      cropperCancel: 'Cancelar',
      cropperSave: 'Confirmar',
      cropperZoom: 'Zoom'
    },
    appearance: {
      title: 'Estilo Visual y Tema',
      desc: 'Modifica el tema de la aplicación. Se aplicará instantáneamente a toda la plataforma.',
      darkTitle: 'Modo Oscuro (Por Defecto)',
      darkDesc: 'Gris antracita mate sofisticado, diseñado para reducir el cansancio visual.',
      lightTitle: 'Modo Claro',
      lightDesc: 'Esquema blanco y gris de alto contraste para ambientes luminosos.',
      active: 'Tema Activo',
      select: 'Activar Tema'
    },
    language: {
      title: 'Idioma del Sistema',
      desc: 'Selecciona tu idioma para cambiar los menús y paneles del espacio de trabajo.',
      esLabel: 'Español (ES)',
      enLabel: 'English (EN)',
      active: 'Idioma Activo',
      select: 'Seleccionar'
    },
    shortcuts: {
      title: 'Hoja de Atajos Rápidos',
      desc: 'Acelera tu ritmo de trabajo navegando con atajos globales por las secciones principales.',
      cheatsheet: 'Atajos de Teclado del Sistema',
      action: 'Acción / Destino',
      key: 'Combinación de Teclas',
      list: [
        { action: 'Ir al Dashboard', key: 'Alt + D' },
        { action: 'Ir a Configuración', key: 'Alt + S' },
        { action: 'Ver Tendencias', key: 'Alt + T' },
        { action: 'Abrir Búsqueda de Clientes', key: '/' },
        { action: 'Cerrar Modales / Diálogos', key: 'Esc' }
      ]
    },
    team: {
      title: 'Gestión del Equipo',
      desc: 'Administra los accesos de tus colaboradores y envía nuevas invitaciones.',
      members: 'Miembros Activos',
      invites: 'Invitaciones Pendientes',
      inviteBtn: 'Enviar Invitación',
      inviteTitle: 'Invitar Nuevo Miembro',
      emailLabel: 'Correo Electrónico',
      roleLabel: 'Rol Asignado',
      memberRole: 'Miembro',
      adminRole: 'Administrador',
      noMembers: 'No se encontraron miembros activos.',
      noInvites: 'No hay invitaciones activas.',
      successInvite: '¡Invitación enviada exitosamente!',
      successCancel: 'Invitación cancelada correctamente.',
      dbMissingTitle: 'Base de Datos no configurada',
      dbMissingDesc: 'Para activar la pestaña de equipo, tu panel de Supabase necesita la tabla de invitaciones. Copia y ejecuta este SQL:'
    }
  },
  en: {
    title: 'Global Settings',
    subtitle: 'Manage your personal profile details, system appearance, language, and team.',
    tabs: {
      profile: 'My Profile',
      appearance: 'Appearance',
      language: 'Language',
      shortcuts: 'Keyboard Shortcuts',
      team: 'Team Members'
    },
    profile: {
      title: 'Profile Information',
      desc: 'Update your full name and upload a custom user avatar photo.',
      nameLabel: 'Full Name',
      avatarLabel: 'Profile Photo / Avatar',
      roleLabel: 'Agency Role',
      saveBtn: 'Save Changes',
      saving: 'Saving...',
      success: 'Profile saved successfully!',
      error: 'Error updating profile.',
      dragDrop: 'Drag an image here or click to upload',
      noAvatar: 'No Profile Photo',
      dbTip: 'Sync Warning',
      dbTipDesc: 'To sync your profile avatar with your team, please run the following SQL command in Supabase editor:',
      dbApplied: 'Avatar will sync directly with the database.',
      dbLocalOnly: 'Saved locally in your browser. Run the SQL query below to sync with the database.',
      userId: 'User ID',
      uploadBtn: 'Upload Photo',
      removeBtn: 'Remove',
      cropperTitle: 'Adjust Profile Photo',
      cropperCancel: 'Cancel',
      cropperSave: 'Confirm',
      cropperZoom: 'Zoom'
    },
    appearance: {
      title: 'Appearance and Styling',
      desc: 'Modify the workspace visual theme. Changes will apply instantly across all pages.',
      darkTitle: 'Dark Mode (Default)',
      darkDesc: 'Sophisticated matte anthracite gray, engineered to minimize eye strain.',
      lightTitle: 'Light Mode',
      lightDesc: 'Clean, high-contrast white and slate color scheme for daylight workspaces.',
      active: 'Active Theme',
      select: 'Activate Theme'
    },
    language: {
      title: 'Workspace Language',
      desc: 'Select your preferred language to translate menus and workspace components.',
      esLabel: 'Spanish (ES)',
      enLabel: 'English (EN)',
      active: 'Active Language',
      select: 'Select'
    },
    shortcuts: {
      title: 'Keyboard Shortcuts Reference',
      desc: 'Accelerate your workflow by navigating the workspace using global shortcuts.',
      cheatsheet: 'System Keyboard Shortcuts',
      action: 'Action / Destination',
      key: 'Key Combination',
      list: [
        { action: 'Go to Dashboard', key: 'Alt + D' },
        { action: 'Go to Settings', key: 'Alt + S' },
        { action: 'View Trends', key: 'Alt + T' },
        { action: 'Open Client Search', key: '/' },
        { action: 'Close Modals / Dialogs', key: 'Esc' }
      ]
    },
    team: {
      title: 'Team Management',
      desc: 'Manage team member permission levels and dispatch new collaborator invites.',
      members: 'Active Members',
      invites: 'Pending Invitations',
      inviteBtn: 'Send Invitation',
      inviteTitle: 'Invite New Member',
      emailLabel: 'Email Address',
      roleLabel: 'Assigned Role',
      memberRole: 'Member',
      adminRole: 'Administrator',
      noMembers: 'No active members found.',
      noInvites: 'No active invitations.',
      successInvite: 'Invitation sent successfully!',
      successCancel: 'Invitation canceled correctly.',
      dbMissingTitle: 'Database table missing',
      dbMissingDesc: 'To activate the team manager tab, your Supabase project requires the invitations table. Copy and run this SQL:'
    }
  }
};

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
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDims, setImageDims] = useState({
    width: 256,
    height: 256,
    naturalWidth: 0,
    naturalHeight: 0
  });

  const cropperImgRef = useRef(null);
  const cropperContainerRef = useRef(null);

  // Estados para la Gestión de la Agencia (Tab Equipo)
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [cancelingInviteId, setCancelingInviteId] = useState(null);
  
  // Enlaces de Invitación Compartidos (Join Links)
  const [inviteLinkCode, setInviteLinkCode] = useState('');
  const [loadingInviteLink, setLoadingInviteLink] = useState(true);
  const [regeneratingLink, setRegeneratingLink] = useState(false);

  // Diagnóstico de base de datos
  const [isDbTableMissing, setIsDbTableMissing] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

  // Inicializar Datos del Perfil
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || profile.full_name || '');
      const cachedAvatar = localStorage.getItem(`cadence-avatar-${profile.id}`);
      setAvatarBase64(profile.avatar_url || cachedAvatar || '');
    }
  }, [profile]);

  // Sincronizar Tema
  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem('cadence-theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    toast.success(nextTheme === 'light' ? 'Modo Claro activado' : 'Modo Oscuro activado');
  };

  // Sincronizar Idioma
  const handleLangChange = (nextLang) => {
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

  // Carga de archivo de Avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Generar Object URL nativo (súper ligero y compatible con cualquier tamaño de archivo)
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setShowCropper(true);

    // Limpiar el valor para poder seleccionar el mismo archivo consecutivamente
    e.target.value = '';
  };

  // Manejo de Drag and Drop para subir imágenes
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setShowCropper(true);
  };

  // Cargar e inicializar dimensiones de imagen de forma ultra-segura al cambiar rawImageSrc
  // Esto evita condiciones de carrera (race conditions) en React con imágenes Base64.
  useEffect(() => {
    if (!rawImageSrc) return;

    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Medida de seguridad ante dimensiones inválidas (0 o NaN)
      if (!naturalWidth || !naturalHeight) {
        setImageDims({
          width: 256,
          height: 256,
          naturalWidth: 256,
          naturalHeight: 256
        });
        setOffset({ x: 0, y: 0 });
        setZoom(1);
        return;
      }

      const viewportSize = 256;
      let initWidth = viewportSize;
      let initHeight = viewportSize;

      if (naturalWidth > naturalHeight) {
        // Landscape: ajustar altura, escalar ancho
        initHeight = viewportSize;
        initWidth = (naturalWidth / naturalHeight) * viewportSize;
      } else {
        // Portrait o Cuadrado: ajustar ancho, escalar altura
        initWidth = viewportSize;
        initHeight = (naturalHeight / naturalWidth) * viewportSize;
      }

      setImageDims({
        width: initWidth,
        height: initHeight,
        naturalWidth,
        naturalHeight
      });

      // Centrar perfectamente en el visor
      setOffset({
        x: (viewportSize - initWidth) / 2,
        y: (viewportSize - initHeight) / 2
      });
      setZoom(1);
    };

    img.onerror = () => {
      console.error('Error al precargar la imagen seleccionada');
      setImageDims({
        width: 256,
        height: 256,
        naturalWidth: 256,
        naturalHeight: 256
      });
      setOffset({ x: 0, y: 0 });
      setZoom(1);
    };

    img.src = rawImageSrc;
  }, [rawImageSrc]);

  // Dragging Mouse / Touch events en el viewport
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - offset.x,
      y: touch.clientY - offset.y
    });
  };

  // Efectos para registrar eventos globales en window al arrastrar (evita perder el foco)
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e) => {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    };

    const handleWindowTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isDragging, dragStart]);

  // Recorte y Compresión con HTML5 Canvas
  const handleCropSave = () => {
    const imgEl = cropperImgRef.current;
    if (!imgEl) return;

    const viewportSize = 256;
    
    // Factor de escala entre visual en zoom=1 y original
    const scaleFactor = imageDims.naturalWidth / imageDims.width;

    // Calcular las dimensiones visuales reales con zoom
    const visualWidth = imageDims.width * zoom;
    const visualHeight = imageDims.height * zoom;

    // Obtener la posición visual de la esquina superior izquierda
    const visualLeft = (imageDims.width / 2 + offset.x) - (visualWidth / 2);
    const visualTop = (imageDims.height / 2 + offset.y) - (visualHeight / 2);

    // Mapear los límites del visor de 256x256 al espacio original de la imagen
    const cropX = (-visualLeft / zoom) * scaleFactor;
    const cropY = (-visualTop / zoom) * scaleFactor;
    const cropW = (viewportSize / zoom) * scaleFactor;
    const cropH = (viewportSize / zoom) * scaleFactor;

    // Crear canvas para el redimensionamiento y compresión
    const canvas = document.createElement('canvas');
    canvas.width = viewportSize;
    canvas.height = viewportSize;
    const ctx = canvas.getContext('2d');

    // Fondo blanco por defecto (para evitar transparencias en JPEG)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, viewportSize, viewportSize);

    // Suavizado premium
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    try {
      ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, viewportSize, viewportSize);
      
      // Comprimir a JPEG con calidad 0.8 (resultando en ~15-25KB)
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      
      setAvatarBase64(compressedBase64);
      closeCropper();
      
      toast.success(lang === 'es' ? 'Foto de perfil recortada y optimizada' : 'Profile photo cropped and optimized');
    } catch (err) {
      console.error('Error al recortar el avatar:', err);
      toast.error(lang === 'es' ? 'Error al procesar la imagen.' : 'Error processing the image.');
    }
  };

  // Guardar Datos del Perfil (Híbrido DB + LocalStorage fallback)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    
    setSavingProfile(true);
    const token = session?.access_token || localStorage.getItem('authToken');

    try {
      // 1) Guardar en localStorage siempre como respaldo local
      if (avatarBase64) {
        localStorage.setItem(`cadence-avatar-${profile.id}`, avatarBase64);
      }

      // 2) Guardar en base de datos
      const updateData = { 
        full_name: fullName.trim() 
      };

      // Si tenemos avatar, agregamos el campo
      if (avatarBase64) {
        updateData.avatar_url = avatarBase64;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) {
        // Detectar si el error se debe a que no existe la columna avatar_url en la base de datos
        if (error.message?.includes('avatar_url') || error.code === 'P0002' || error.message?.includes('does not exist')) {
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

      // Notificar cambio de perfil para propagación
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

  // SQL para la base de datos
  const sqlSetupCode = `-- =========================================================================
-- SQL PARA CREAR LAS TABLAS DE INVITACIÓN EN SUPABASE
-- =========================================================================

-- 1) Tabla de Invitaciones Directas por Email
CREATE TABLE IF NOT EXISTS public.agency_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (agency_id, email)
);

ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.agency_invitations;
CREATE POLICY "Permitir todo a autenticados" ON public.agency_invitations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2) Tabla de Enlaces de Invitación Compartidos (Join Links)
CREATE TABLE IF NOT EXISTS public.agency_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    uses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_invite_links_code ON public.agency_invite_links(code);
ALTER TABLE public.agency_invite_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.agency_invite_links;
CREATE POLICY "Permitir todo a autenticados" ON public.agency_invite_links FOR ALL TO authenticated USING (true) WITH CHECK (true);`;

  const sqlAvatarSetup = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;

  // Gestión de Equipo: Obtener Datos
  const fetchAgencyData = async () => {
    setLoadingMembers(true);
    setLoadingInvites(true);
    setLoadingInviteLink(true);
    setIsDbTableMissing(false);

    const token = session?.access_token || localStorage.getItem('authToken');
    if (!token) {
      setLoadingMembers(false);
      setLoadingInvites(false);
      setLoadingInviteLink(false);
      return;
    }

    try {
      const membersRes = await fetch(`${apiBaseUrl}/invitations/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const membersResult = await membersRes.json();

      if (!membersRes.ok) {
        const errMsg = membersResult.message || '';
        if (
          errMsg.includes('agency_invitations') || 
          errMsg.includes('relation') || 
          errMsg.includes('does not exist')
        ) {
          setIsDbTableMissing(true);
          setLoadingMembers(false);
          setLoadingInvites(false);
          setLoadingInviteLink(false);
          return;
        }
        throw new Error(errMsg || 'Error');
      }

      setMembers(membersResult.data || []);

      if (profile?.role === 'admin') {
        const invitesRes = await fetch(`${apiBaseUrl}/invitations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const invitesResult = await invitesRes.json();

        if (!invitesRes.ok) {
          const errMsg = invitesResult.message || '';
          if (
            errMsg.includes('agency_invitations') || 
            errMsg.includes('relation') || 
            errMsg.includes('does not exist')
          ) {
            setIsDbTableMissing(true);
            setLoadingMembers(false);
            setLoadingInvites(false);
            setLoadingInviteLink(false);
            return;
          }
          throw new Error(errMsg || 'Error');
        }

        setPendingInvitations(invitesResult.data || []);

        // Obtener el enlace de invitación activo de la agencia
        try {
          const linkRes = await fetch(`${apiBaseUrl}/invitations/links/active`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const linkResult = await linkRes.json();
          
          if (!linkRes.ok) {
            const errMsg = linkResult.message || '';
            if (
              errMsg.includes('agency_invite_links') ||
              errMsg.includes('relation') ||
              errMsg.includes('does not exist')
            ) {
              setIsDbTableMissing(true);
              setLoadingMembers(false);
              setLoadingInvites(false);
              setLoadingInviteLink(false);
              return;
            }
            throw new Error(errMsg || 'Error');
          }
          
          if (linkResult.success && linkResult.data) {
            setInviteLinkCode(linkResult.data.code);
          }
        } catch (linkErr) {
          console.error('Error al cargar enlace de invitación:', linkErr.message);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
      setLoadingInvites(false);
      setLoadingInviteLink(false);
    }
  };

  useEffect(() => {
    if (profile && activeTab === 'team') {
      fetchAgencyData();
    }
  }, [profile, activeTab]);

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Ingresa un correo electrónico.');
      return;
    }

    setSendingInvite(true);
    const token = session?.access_token || localStorage.getItem('authToken');

    try {
      const res = await fetch(`${apiBaseUrl}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error');

      toast.success(t.team.successInvite);
      setInviteEmail('');
      setInviteRole('member');
      fetchAgencyData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('¿Cancelar esta invitación?')) return;

    setCancelingInviteId(invitationId);
    const token = session?.access_token || localStorage.getItem('authToken');

    try {
      const res = await fetch(`${apiBaseUrl}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error');

      toast.success(t.team.successCancel);
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelingInviteId(null);
    }
  };

  const handleRegenerateLink = async () => {
    const confirmationMsg = lang === 'es' 
      ? '¿Estás seguro de que deseas regenerar el enlace? El enlace anterior dejará de funcionar inmediatamente.'
      : 'Are you sure you want to regenerate the invite link? The previous link will stop working immediately.';
      
    if (!window.confirm(confirmationMsg)) return;

    setRegeneratingLink(true);
    const token = session?.access_token || localStorage.getItem('authToken');

    try {
      const res = await fetch(`${apiBaseUrl}/invitations/links/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error');

      toast.success(lang === 'es' ? '¡Enlace de invitación de la agencia regenerado!' : 'Agency invitation link regenerated!');
      setInviteLinkCode(result.data.code);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegeneratingLink(false);
    }
  };

  const copyToClipboard = (code) => {
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
  ];

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3'>
          {t.title}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navegación Lateral (Tabs) */}
        <div className="md:col-span-1 space-y-2">
          {/* Layout en columna para desktop, horizontal scroll para mobile */}
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1 md:gap-1.5 scrollbar-none">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 flex-shrink-0 md:flex-shrink w-auto md:w-full border ${
                    isActive
                      ? 'bg-surface border-border-strong text-text-primary shadow-sm'
                      : 'border-transparent text-text-muted hover:bg-surface-soft hover:text-text-primary'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-text-primary' : 'text-text-muted'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Contenido Principal */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* TAB 1: MI PERFIL */}
              {activeTab === 'profile' && (
                <Card className="surface">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                      <UserIcon className="h-5 w-5" />
                      {t.profile.title}
                    </CardTitle>
                    <p className="text-xs text-text-muted mt-1">{t.profile.desc}</p>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-surface-soft border border-border-subtle transition duration-200 hover:border-border-strong w-full"
                      >
                        <div className="relative group flex-shrink-0">
                          {avatarBase64 ? (
                            <img 
                              src={avatarBase64} 
                              alt="User Avatar Preview" 
                              className="h-20 w-20 rounded-full object-cover border-2 border-border-strong shadow-md"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-surface-strong border-2 border-border-subtle flex items-center justify-center font-bold text-xl text-text-muted uppercase">
                              {fullName ? fullName.charAt(0) : 'U'}
                            </div>
                          )}
                          <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t.profile.uploadBtn}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleAvatarChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                        
                        <div className="space-y-1.5 text-center sm:text-left flex-1">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary">{t.profile.avatarLabel}</label>
                          <p className="text-xs text-text-muted leading-relaxed">
                            {avatarBase64 ? t.profile.dbApplied : t.profile.dragDrop}
                          </p>
                          <div className="flex gap-2 justify-center sm:justify-start">
                            <button
                              type="button"
                              onClick={() => document.getElementById('avatar-input').click()}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border-subtle text-text-primary hover:bg-surface-strong transition"
                            >
                              {t.profile.uploadBtn}
                            </button>
                            {avatarBase64 && (
                              <button
                                type="button"
                                onClick={() => setAvatarBase64('')}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
                              >
                                {lang === 'es' ? 'Quitar' : 'Remove'}
                              </button>
                            )}
                          </div>
                          <input 
                            id="avatar-input" 
                            type="file" 
                            accept="image/*" 
                            onChange={handleAvatarChange} 
                            className="hidden" 
                          />
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                            {t.profile.nameLabel}
                          </label>
                          <Input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="input-cyber font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                            {t.profile.roleLabel}
                          </label>
                          <div className="p-2.5 rounded-xl bg-surface-soft border border-border-subtle flex items-center justify-between text-sm font-semibold capitalize text-text-primary">
                            <span>{profile?.role === 'admin' ? t.team.adminRole : t.team.memberRole}</span>
                            <ShieldCheckIcon className="h-5 w-5 text-text-muted" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="text-[11px] text-text-muted font-mono">
                          {t.profile.userId}: {profile?.id}
                        </div>
                        <CyberButton
                          type="submit"
                          disabled={savingProfile}
                          loading={savingProfile}
                        >
                          {savingProfile ? t.profile.saving : t.profile.saveBtn}
                        </CyberButton>
                      </div>
                    </form>

                    {/* SQL Warning Panel inside profile tab for avatar fallback */}
                    {avatarColMissing && (
                      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3 mt-4 text-xs text-text-muted leading-relaxed">
                        <div className="flex items-center gap-2 text-yellow-500 font-semibold uppercase tracking-wider">
                          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                          <span>{t.profile.dbTip}</span>
                        </div>
                        <p>{t.profile.dbTipDesc}</p>
                        <div className="relative mt-2 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] p-2.5 text-yellow-500/90 flex justify-between items-center">
                          <pre>{sqlAvatarSetup}</pre>
                          <button
                            onClick={() => copyToClipboard(sqlAvatarSetup)}
                            className="p-1 rounded bg-surface border border-white/10 hover:bg-surface-strong text-text-primary transition"
                            title="Copiar SQL"
                          >
                            <ClipboardIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] italic">{t.profile.dbLocalOnly}</p>
                      </div>
                    )}

                  </CardContent>
                </Card>
              )}

              {/* TAB 2: APARIENCIA */}
              {activeTab === 'appearance' && (
                <Card className="surface">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                      <PaintBrushIcon className="h-5 w-5" />
                      {t.appearance.title}
                    </CardTitle>
                    <p className="text-xs text-text-muted mt-1">{t.appearance.desc}</p>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Modo Oscuro */}
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`flex flex-col text-left p-5 rounded-2xl border transition duration-200 ${
                          theme === 'dark'
                            ? 'bg-surface border-border-strong ring-1 ring-border-strong shadow-md'
                            : 'border-border-subtle bg-surface-soft/40 hover:bg-surface-soft hover:border-border-strong'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm text-text-primary">{t.appearance.darkTitle}</span>
                          {theme === 'dark' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              <CheckIcon className="h-3 w-3" />
                              {t.appearance.active}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-2 leading-relaxed">{t.appearance.darkDesc}</p>
                        <div className="mt-4 w-full h-16 rounded-lg bg-[#161517] border border-border-subtle flex p-2 gap-2">
                          <div className="w-1/4 h-full bg-[#1C1A1E] rounded border border-border-subtle"></div>
                          <div className="w-3/4 h-full bg-[#222024] rounded border border-border-subtle flex flex-col gap-1 p-1">
                            <div className="w-1/2 h-2 bg-text-muted/20 rounded"></div>
                            <div className="w-full h-2 bg-text-muted/10 rounded"></div>
                          </div>
                        </div>
                      </button>

                      {/* Modo Claro */}
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`flex flex-col text-left p-5 rounded-2xl border transition duration-200 ${
                          theme === 'light'
                            ? 'bg-surface border-border-strong ring-1 ring-border-strong shadow-md'
                            : 'border-border-subtle bg-surface-soft/40 hover:bg-surface-soft hover:border-border-strong'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm text-text-primary">{t.appearance.lightTitle}</span>
                          {theme === 'light' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              <CheckIcon className="h-3 w-3" />
                              {t.appearance.active}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-2 leading-relaxed">{t.appearance.lightDesc}</p>
                        <div className="mt-4 w-full h-16 rounded-lg bg-[#F8FAFC] border border-border-subtle flex p-2 gap-2">
                          <div className="w-1/4 h-full bg-[#F1F5F9] rounded border border-border-subtle"></div>
                          <div className="w-3/4 h-full bg-[#FFFFFF] rounded border border-border-subtle flex flex-col gap-1 p-1">
                            <div className="w-1/2 h-2 bg-text-muted/30 rounded"></div>
                            <div className="w-full h-2 bg-text-muted/10 rounded"></div>
                          </div>
                        </div>
                      </button>

                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAB 3: IDIOMA */}
              {activeTab === 'language' && (
                <Card className="surface">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                      <LanguageIcon className="h-5 w-5" />
                      {t.language.title}
                    </CardTitle>
                    <p className="text-xs text-text-muted mt-1">{t.language.desc}</p>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Español */}
                      <button
                        onClick={() => handleLangChange('es')}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                          lang === 'es'
                            ? 'bg-surface border-border-strong ring-1 ring-border-strong shadow-sm'
                            : 'border-border-subtle bg-surface-soft/40 hover:bg-surface-soft hover:border-border-strong'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm text-text-primary">{t.language.esLabel}</span>
                          <span className="text-[10px] text-text-muted mt-0.5">Spanish translation active</span>
                        </div>
                        {lang === 'es' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            <CheckIcon className="h-3.5 w-3.5" />
                            {t.language.active}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-text-muted group-hover:text-text-primary flex items-center gap-1">
                            {t.language.select} <ChevronRightIcon className="h-3 w-3" />
                          </span>
                        )}
                      </button>

                      {/* Inglés */}
                      <button
                        onClick={() => handleLangChange('en')}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                          lang === 'en'
                            ? 'bg-surface border-border-strong ring-1 ring-border-strong shadow-sm'
                            : 'border-border-subtle bg-surface-soft/40 hover:bg-surface-soft hover:border-border-strong'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm text-text-primary">{t.language.enLabel}</span>
                          <span className="text-[10px] text-text-muted mt-0.5">English translation active</span>
                        </div>
                        {lang === 'en' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            <CheckIcon className="h-3.5 w-3.5" />
                            {t.language.active}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-text-muted flex items-center gap-1">
                            {t.language.select} <ChevronRightIcon className="h-3 w-3" />
                          </span>
                        )}
                      </button>

                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAB 4: ATAJOS DE TECLADO */}
              {activeTab === 'shortcuts' && (
                <Card className="surface">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                        <CommandLineIcon className="h-5 w-5" />
                        {t.shortcuts.title}
                      </CardTitle>
                      <p className="text-xs text-text-muted mt-1">{t.shortcuts.desc}</p>
                    </div>
                    <button
                      onClick={() => setIsKeyboardModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-strong text-xs font-bold text-text-primary transition self-start sm:self-auto"
                    >
                      {lang === 'es' ? 'Modal Completo' : 'View Keyboard Modal'}
                    </button>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="rounded-xl border border-border-subtle bg-surface-soft/40 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-strong border-b border-border-subtle text-xs font-bold uppercase tracking-wider text-text-muted">
                          <tr>
                            <th className="px-4 py-3">{t.shortcuts.action}</th>
                            <th className="px-4 py-3">{t.shortcuts.key}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle font-medium text-text-primary">
                          {t.shortcuts.list.map((shortcut, i) => (
                            <tr key={i} className="hover:bg-surface transition">
                              <td className="px-4 py-3.5">{shortcut.action}</td>
                              <td className="px-4 py-3.5">
                                <kbd className="px-2 py-1.5 text-xs font-semibold font-mono rounded-lg bg-surface border border-border-strong text-text-muted shadow-sm uppercase tracking-wide">
                                  {shortcut.key}
                                </kbd>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAB 5: GESTIÓN DE EQUIPO */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  
                  {isDbTableMissing ? (
                    <Card className="border border-red-500/20 bg-red-950/5">
                      <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                          {t.team.dbMissingTitle}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        <p className="text-xs text-text-primary leading-relaxed">
                          {t.team.dbMissingDesc}
                        </p>
                        
                        <div className="relative mt-2 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-red-400/90 p-4 max-h-48 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">{sqlSetupCode}</pre>
                          <button
                            onClick={() => copyToClipboard(sqlSetupCode)}
                            className="absolute top-2 right-2 p-1.5 rounded bg-surface border border-white/10 text-white hover:bg-surface-strong transition"
                            title="Copiar SQL"
                          >
                            <ClipboardIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex gap-4 pt-2">
                          <CyberButton onClick={() => copyToClipboard(sqlSetupCode)} size="sm">
                            Copiar Código SQL
                          </CyberButton>
                          <CyberButton onClick={fetchAgencyData} size="sm">
                            Reintentar
                          </CyberButton>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="surface p-0 overflow-hidden">
                      <div className="p-6 border-b border-border-subtle bg-gradient-to-r from-surface-strong to-surface-soft/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <h2 className='text-lg font-bold text-text-primary flex items-center gap-2'>
                            <UserGroupIcon className="h-5 w-5" />
                            {t.team.title}
                          </h2>
                          <p className='text-xs text-text-muted mt-1'>{t.team.desc}</p>
                        </div>

                        {profile?.role !== 'admin' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 max-w-max">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5 animate-pulse" />
                            {lang === 'es' ? 'Solo Lectura' : 'Read Only'}
                          </span>
                        )}
                      </div>

                      <div className="p-6 space-y-6">
                        {profile?.role !== 'admin' && (
                          <div className="rounded-xl border border-border-subtle bg-surface-soft/40 p-4 text-xs text-text-muted leading-relaxed">
                            {lang === 'es' 
                              ? 'Como miembro, puedes ver el equipo activo pero necesitas privilegios de Administrador para invitar a nuevos colaboradores.' 
                              : 'As a member, you can view the active team, but you need Administrator privileges to dispatch collaborator invites.'}
                          </div>
                        )}

                        <div className={`grid grid-cols-1 ${profile?.role === 'admin' ? 'lg:grid-cols-5' : ''} gap-6`}>
                          
                          {/* Listado de Miembros */}
                          <div className={`${profile?.role === 'admin' ? 'lg:col-span-3' : 'w-full'} space-y-4`}>
                            <h3 className="text-sm font-semibold text-text-primary">
                              {t.team.members} ({members.length})
                            </h3>

                            {loadingMembers ? (
                              <div className="py-12 text-center text-text-muted text-xs flex flex-col items-center justify-center gap-3 font-medium">
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                {lang === 'es' ? 'Cargando equipo...' : 'Loading active team...'}
                              </div>
                            ) : members.length === 0 ? (
                              <div className="py-8 text-center text-xs text-text-muted rounded-xl border border-dashed border-border-subtle bg-surface-soft/20">
                                {t.team.noMembers}
                              </div>
                            ) : (
                              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                {members.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-surface-soft/60 border border-border-subtle hover:border-border-strong transition duration-200"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-full bg-surface-strong border border-border-subtle flex items-center justify-center font-bold text-xs text-text-primary uppercase">
                                        {member.fullName?.charAt(0) || 'U'}
                                      </div>
                                      <div className="space-y-0.5">
                                        <h4 className="font-semibold text-text-primary text-xs flex items-center gap-1.5">
                                          {member.fullName} 
                                          {member.id === profile?.id && <span className="text-[10px] text-text-muted">(Tú)</span>}
                                        </h4>
                                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                                          <EnvelopeIcon className="h-3 w-3" />
                                          {member.email}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                                      member.role === 'admin' 
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                    }`}>
                                      {member.role === 'admin' ? t.team.adminRole : t.team.memberRole}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Invitaciones */}
                          {profile?.role === 'admin' && (
                            <div className="lg:col-span-2 space-y-6">
                              
                              {/* Enlace Compartido de Invitación */}
                              <div className="rounded-xl border border-border-subtle bg-surface-soft/30 p-4 space-y-4">
                                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                  <SparklesIcon className="h-4 w-4 text-primary-400" />
                                  {lang === 'es' ? 'Enlace de Invitación' : 'Invitation Link'}
                                </h3>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                  {lang === 'es' 
                                    ? 'Cualquier persona con este enlace podrá unirse automáticamente a tu agencia.' 
                                    : 'Anyone with this link can automatically join your agency.'}
                                </p>
                                
                                <div className="flex gap-2">
                                  <div className="flex-1 bg-black/30 border border-border-subtle rounded-xl px-3 py-2 text-xs font-mono text-text-primary overflow-x-auto whitespace-nowrap scrollbar-none select-all flex items-center">
                                    {inviteLinkCode 
                                      ? window.location.origin + '/join/' + inviteLinkCode 
                                      : (lang === 'es' ? 'Generando...' : 'Generating...')}
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(inviteLinkCode ? window.location.origin + '/join/' + inviteLinkCode : '')}
                                    className="p-2 rounded-xl border border-border-subtle hover:bg-surface-strong text-text-primary transition"
                                    title={lang === 'es' ? 'Copiar Enlace' : 'Copy Link'}
                                    disabled={!inviteLinkCode}
                                  >
                                    <ClipboardIcon className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    onClick={handleRegenerateLink}
                                    disabled={regeneratingLink || loadingInviteLink || !inviteLinkCode}
                                    className="text-[10px] font-bold text-text-muted hover:text-text-primary flex items-center gap-1 transition"
                                  >
                                    <ArrowPathIcon className={`h-3 w-3 ${regeneratingLink ? 'animate-spin' : ''}`} />
                                    {lang === 'es' ? 'Regenerar enlace' : 'Regenerate link'}
                                  </button>
                                </div>
                              </div>

                              {/* Formulario */}
                              <div className="rounded-xl border border-border-subtle bg-surface-soft/30 p-4 space-y-4">
                                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                  <UserPlusIcon className="h-4 w-4" />
                                  {t.team.inviteTitle}
                                </h3>
                                <form onSubmit={handleSendInvitation} className="space-y-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                                      {t.team.emailLabel}
                                    </label>
                                    <Input
                                      type="email"
                                      placeholder="nombre@empresa.com"
                                      value={inviteEmail}
                                      onChange={(e) => setInviteEmail(e.target.value)}
                                      required
                                      className="input-cyber text-xs py-2"
                                      disabled={sendingInvite}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                                      {t.team.roleLabel}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setInviteRole('member')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                          inviteRole === 'member'
                                            ? 'bg-surface border-border-strong text-text-primary'
                                            : 'bg-surface-strong border-transparent text-text-muted hover:border-border-subtle'
                                        }`}
                                      >
                                        {t.team.memberRole}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setInviteRole('admin')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                          inviteRole === 'admin'
                                            ? 'bg-surface border-border-strong text-text-primary'
                                            : 'bg-surface-strong border-transparent text-text-muted hover:border-border-subtle'
                                        }`}
                                      >
                                        Admin
                                      </button>
                                    </div>
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={sendingInvite}
                                    className="w-full btn-cyber text-xs font-semibold py-2"
                                  >
                                    {sendingInvite ? '...' : t.team.inviteBtn}
                                  </button>
                                </form>
                              </div>

                              {/* Lista de Invitaciones */}
                              <div className="space-y-3.5">
                                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                  <ClockIcon className="h-4 w-4" />
                                  {t.team.invites} ({pendingInvitations.length})
                                </h3>

                                {loadingInvites ? (
                                  <div className="py-4 text-center text-text-muted text-xs animate-pulse">
                                    ...
                                  </div>
                                ) : pendingInvitations.length === 0 ? (
                                  <div className="py-5 text-center text-[11px] text-text-muted rounded-xl border border-dashed border-border-subtle bg-surface-soft/10">
                                    {t.team.noInvites}
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                    {pendingInvitations.map((inv) => (
                                      <div
                                        key={inv.id}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-soft/40 border border-border-subtle"
                                      >
                                        <div className="space-y-0.5 min-w-0">
                                          <h4 className="font-semibold text-text-primary text-xs truncate max-w-[140px]">
                                            {inv.email}
                                          </h4>
                                          <span className="text-[10px] text-text-muted capitalize">
                                            {inv.role === 'admin' ? t.team.adminRole : t.team.memberRole}
                                          </span>
                                        </div>

                                        <button
                                          onClick={() => handleCancelInvitation(inv.id)}
                                          disabled={cancelingInviteId === inv.id}
                                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition"
                                          title="Cancelar"
                                        >
                                          {cancelingInviteId === inv.id ? (
                                            <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <TrashIcon className="h-3.5 w-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>
                          )}

                        </div>
                      </div>
                    </Card>
                  )}

                </div>
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-surface border border-border-strong rounded-3xl p-6 max-w-sm w-full flex flex-col items-center shadow-2xl space-y-6"
            >
              <div className="w-full text-center">
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  {t.profile.cropperTitle}
                </h3>
              </div>

              {/* Crop Circular Viewport */}
              <div 
                ref={cropperContainerRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="w-64 h-64 rounded-full overflow-hidden relative border-2 border-border-strong bg-black/30 cursor-grab active:cursor-grabbing select-none"
              >
                <img 
                  ref={cropperImgRef}
                  src={rawImageSrc}
                  alt="Crop Preview"
                  draggable={false}
                  className="absolute select-none pointer-events-none origin-center"
                  style={{
                    width: `${imageDims.width}px`,
                    height: `${imageDims.height}px`,
                    left: 0,
                    top: 0,
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                />
              </div>

              {/* Slider de Zoom */}
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-semibold text-text-muted">
                  <span>{t.profile.cropperZoom}</span>
                  <span>{zoom.toFixed(2)}x</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="3"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--color-accent-lavender, #4F46E5)' }}
                  className="w-full h-1 bg-surface-soft rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={closeCropper}
                  className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-border-subtle hover:bg-surface-soft text-text-muted hover:text-text-primary transition duration-150"
                >
                  {t.profile.cropperCancel}
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl bg-accent-lavender text-white hover:bg-opacity-90 shadow-md transition duration-150"
                >
                  {t.profile.cropperSave}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
