import { useState, useEffect } from 'react';
import { getApiUrl } from '@api/apiFetch';

export const Onboarding = ({ session, onProfileComplete }) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [checkingInvitation, setCheckingInvitation] = useState(true);

  // Obtenemos la URL base de la API de forma dinámica y robusta
  const API_URL = getApiUrl();

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        // 1) Primero comprobar si tiene una invitación directa por email
        const response = await fetch(`${API_URL}/invitations/pending`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const result = await response.json();
        if (response.ok && result.success && result.data) {
          setInvitation(result.data);
          return;
        }

        // 2) Si no, comprobar si hay un código de enlace de invitación pendiente en localStorage
        const pendingCode = localStorage.getItem('pending_invite_code');
        if (pendingCode) {
          const res = await fetch(`${API_URL}/shared/invite/${pendingCode}`);
          const resJson = await res.json();
          if (res.ok && resJson.success && resJson.data) {
            setInvitation({
              agencyName: resJson.data.agencyName,
              role: resJson.data.role,
              isLinkInvite: true,
              code: pendingCode
            });
          }
        }
      } catch (err) {
        console.error('Error checking active invitation:', err);
      } finally {
        setCheckingInvitation(false);
      }
    };
    checkInvitation();
  }, [API_URL, session.access_token]);

  const handleCompleteProfile = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      let url = `${API_URL}/users/complete-profile`;
      const pendingCode = localStorage.getItem('pending_invite_code') || undefined;
      let bodyData = { fullName, agencyName, inviteCode: pendingCode };

      // Si existe una invitación directa por email
      if (invitation && !invitation.isLinkInvite) {
        url = `${API_URL}/invitations/accept`;
        bodyData = { fullName };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al completar el perfil.');
      }

      // Limpiar el código pendiente en el almacenamiento local
      localStorage.removeItem('pending_invite_code');

      if (invitation) {
        alert('¡Te has unido a la agencia exitosamente!');
      } else {
        alert('¡Agencia creada exitosamente!');
      }
      onProfileComplete();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingInvitation) {
    return (
      <div className='min-h-screen text-text-primary flex items-center justify-center p-6'>
        <div className='text-rambla-text-secondary animate-pulse'>Buscando invitaciones...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen text-text-primary flex items-center justify-center p-6 bg-app'>
      <div className='w-full max-w-md card rounded-xl border border-white/10 bg-surface-strong p-6 shadow-lg'>
        <h2 className='mb-1 text-2xl font-bold text-cyber-gradient text-white'>Completa tu registro</h2>
        <p className='mb-6 text-sm text-text-muted'>
          ¡Bienvenido! Solo un paso más para empezar a trabajar.
        </p>

        {invitation && (
          <div className="mb-6 rounded-xl border border-primary-500/20 bg-primary-950/20 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h4 className="font-semibold text-white">¡Invitación Encontrada!</h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Has sido invitado a unirte a la agencia <span className="font-bold text-primary-400">{invitation.agencyName}</span>. 
                  Solo ingresa tu nombre para unirte.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleCompleteProfile} className='space-y-4'>
          <div>
            <label htmlFor='fullName' className='mb-1 block text-sm text-text-muted'>
              Tu nombre completo
            </label>
            <input
              id='fullName'
              type='text'
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30'
              placeholder='Ej: Juan Pérez'
              required
            />
          </div>

          {!invitation && (
            <div>
              <label htmlFor='agencyName' className='mb-1 block text-sm text-text-muted'>
                Nombre de tu agencia
              </label>
              <input
                id='agencyName'
                type='text'
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30'
                placeholder='Ej: Mi Agencia Digital'
                required
              />
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full btn-cyber px-4 py-2 font-semibold hover-cyber-glow disabled:opacity-60'
          >
            {loading ? 'Procesando...' : invitation ? 'Aceptar Invitación y Unirse' : 'Crear Agencia'}
          </button>
        </form>
      </div>
    </div>
  );
};
