import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CyberButton } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { getApiUrl } from '@api/apiFetch';

export const JoinPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [session, setSession] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const apiBaseUrl = getApiUrl();

  // 1) Cargar sesión y resolver el código
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      setError('');

      try {
        // Cargar sesión de Supabase
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);

        // Resolver el código de forma pública
        const res = await fetch(`${apiBaseUrl}/shared/invite/${code}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || 'Código de invitación no válido o expirado.');
        }

        setInviteInfo(result.data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error de conexión.');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [code]);

  // 2) Aceptar invitación para usuario autenticado
  const handleAcceptInvite = async () => {
    if (!session) return;
    setAccepting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/invitations/links/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error al unirse a la agencia.');
      }

      toast.success('¡Te has unido exitosamente a la agencia!');

      // Limpiar códigos pendientes
      localStorage.removeItem('pending_invite_code');

      // Redirigir y forzar reload para refrescar el perfil de la app en App.jsx
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      toast.error(err.message);
      setAccepting(false);
    }
  };

  // 3) Redirigir a registro/login guardando el código en localStorage
  const handleRedirectToAuth = () => {
    localStorage.setItem('pending_invite_code', code);
    toast.success('Código guardado. Completa tu acceso para unirte.');

    // Redirige al home donde está el AuthPage
    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#111012] flex items-center justify-center p-6 text-text-primary'>
        <div className='text-center space-y-4'>
          <div className='h-10 w-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto'></div>
          <p className='text-xs text-text-muted animate-pulse font-medium'>
            Resolviendo invitación de la agencia...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#0e0d0f] flex items-center justify-center p-6 relative overflow-hidden text-text-primary'>
      {/* Luces y partículas de fondo premium */}
      <div className='absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary-600/10 blur-[120px] pointer-events-none' />
      <div className='absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none' />

      <div className='w-full max-w-lg relative z-10'>
        {/* Caso de error o link inválido */}
        {error ? (
          <Card hover={false} className='border-red-500/20 bg-red-950/5 backdrop-blur-md'>
            <CardHeader className='text-center border-b border-red-500/10 pb-4'>
              <ExclamationTriangleIcon className='h-12 w-12 text-red-500 mx-auto mb-2 animate-bounce' />
              <CardTitle className='text-red-400 text-xl font-bold'>Invitación Inválida</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6 text-center'>
              <p className='text-sm text-text-muted leading-relaxed'>
                El enlace de ingreso que estás utilizando ha expirado, fue revocado por el
                administrador de la agencia o no existe.
              </p>
              <div className='pt-2'>
                <CyberButton
                  onClick={() => (window.location.href = '/')}
                  variant='secondary'
                  className='w-full'
                >
                  Volver a la Página de Inicio
                </CyberButton>
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className='space-y-4'
          >
            {/* Header / Logo de la plataforma */}
            <div className='text-center mb-6'>
              <h2 className='text-2xl font-bold tracking-wider text-white flex items-center justify-center gap-2'>
                <SparklesIcon className='h-6 w-6 text-primary-400' />
                CADENCE
              </h2>
              <p className='text-xs text-text-muted mt-1 uppercase tracking-widest'>
                Colaboración de Contenidos
              </p>
            </div>

            {/* Tarjeta de Invitación */}
            <Card
              hover={false}
              className='border border-white/5 bg-surface-strong/40 backdrop-blur-md overflow-hidden p-0'
            >
              <div className='p-6 border-b border-white/5 bg-gradient-to-r from-primary-950/20 to-indigo-950/20 text-center py-8'>
                <div className='h-16 w-16 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-lg mb-4'>
                  {inviteInfo?.agencyName?.charAt(0) || 'A'}
                </div>

                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20 uppercase tracking-wider mb-2'>
                  <UserGroupIcon className='h-3.5 w-3.5' />
                  Invitación de Equipo
                </span>

                <h3 className='text-xl font-bold text-text-primary px-2'>
                  ¡Te han invitado a unirte a{' '}
                  <span className='text-primary-400'>{inviteInfo?.agencyName}</span>!
                </h3>
              </div>

              <div className='p-6 space-y-6'>
                <div className='rounded-xl bg-surface-soft/60 border border-white/5 p-4 space-y-3.5 text-sm text-text-muted'>
                  <div className='flex items-center gap-3'>
                    <ShieldCheckIcon className='h-5 w-5 text-indigo-400 flex-shrink-0' />
                    <span>
                      Te unirás con el rol de{' '}
                      <strong className='text-text-primary capitalize'>{inviteInfo?.role}</strong>.
                    </span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <BuildingOfficeIcon className='h-5 w-5 text-indigo-400 flex-shrink-0' />
                    <span>
                      Tendrás acceso a ver los clientes, documentos y cronogramas de contenido de la
                      agencia.
                    </span>
                  </div>
                </div>

                {/* Diferenciar si está autenticado o no */}
                {session ? (
                  <div className='space-y-3'>
                    <div className='text-xs text-text-muted text-center flex items-center justify-center gap-1.5 p-2 border border-dashed border-border-subtle rounded-xl bg-surface-soft/30'>
                      <span className='h-2 w-2 rounded-full bg-emerald-500 inline-block'></span>
                      Sesión activa:{' '}
                      <span className='font-semibold text-text-primary'>{session.user.email}</span>
                    </div>

                    <CyberButton
                      onClick={handleAcceptInvite}
                      disabled={accepting}
                      loading={accepting}
                      className='w-full'
                    >
                      Aceptar Invitación y Unirse ahora
                    </CyberButton>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <p className='text-xs text-text-muted text-center leading-relaxed'>
                      Necesitas crear una cuenta o iniciar sesión con tu correo para vincularte a la
                      agencia.
                    </p>
                    <div className='grid grid-cols-2 gap-3'>
                      <button
                        onClick={handleRedirectToAuth}
                        className='px-4 py-2.5 text-xs font-semibold rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 transition w-full'
                      >
                        Crear Cuenta nueva
                      </button>
                      <button
                        onClick={handleRedirectToAuth}
                        className='px-4 py-2.5 text-xs font-semibold rounded-xl bg-surface border border-border-subtle text-text-primary hover:bg-surface-strong transition w-full flex items-center justify-center gap-1'
                      >
                        Iniciar Sesión <ArrowRightIcon className='h-3 w-3' />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
