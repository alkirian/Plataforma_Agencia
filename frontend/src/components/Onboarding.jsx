import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '@api/apiFetch';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

// Premium styling constants
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] text-text-primary placeholder-text-muted/40 focus:border-[#7C5CFC]/60 focus:bg-white/[0.04] focus:ring-4 focus:ring-[#7C5CFC]/15 focus:outline-none transition-all duration-300 text-sm font-medium';
const primaryBtn =
  'relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#FF6B6B] px-5 py-3 font-extrabold text-white text-sm shadow-[0_0_20px_rgba(124,92,252,0.25)] hover:shadow-[0_0_30px_rgba(124,92,252,0.45)] transition-all duration-300 hover:opacity-95 active:scale-[0.98] cursor-pointer';

export const Onboarding = ({ session, onProfileComplete }) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agencyType, setAgencyType] = useState('agency'); // 'agency', 'own_business'
  const [step, setStep] = useState('choice'); // 'choice', 'details'
  const [invitation, setInvitation] = useState(null);
  const [checkingInvitation, setCheckingInvitation] = useState(true);

  // Dynamic Base URL
  const API_URL = getApiUrl();

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        // A) Intentar primero vía Supabase RPCs (altamente resiliente y veloz)
        try {
          const { data: rpcInvData, error: rpcInvError } = await supabase.rpc('check_pending_invitations');
          if (!rpcInvError && rpcInvData && rpcInvData.length > 0) {
            const inv = rpcInvData[0];
            setInvitation({
              id: inv.id,
              agencyId: inv.agency_id,
              agencyName: inv.agency_name,
              role: inv.role,
              status: inv.status
            });
            setStep('details');
            return;
          }

          const pendingCode = localStorage.getItem('pending_invite_code');
          if (pendingCode) {
            const { data: rpcLinkData, error: rpcLinkError } = await supabase.rpc('resolve_invite_link', {
              invite_code: pendingCode
            });
            if (!rpcLinkError && rpcLinkData && rpcLinkData.length > 0) {
              const linkInfo = rpcLinkData[0];
              setInvitation({
                agencyName: linkInfo.agency_name,
                role: linkInfo.role,
                isLinkInvite: true,
                code: pendingCode,
              });
              setStep('details');
              return;
            }
          }
        } catch (rpcErr) {
          console.warn('[Onboarding] Supabase RPCs de invitaciones fallaron, intentando backend:', rpcErr);
        }

        // B) Fallback: Consultar backend Express
        // 1) First verify if there is an active direct email invite
        try {
          const response = await fetch(`${API_URL}/invitations/pending`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          const result = await response.json();
          if (response.ok && result.success && result.data) {
            setInvitation(result.data);
            setStep('details'); // Go directly to details
            return;
          }
        } catch (err) {
          console.warn('[Onboarding] Error al consultar invitaciones pendientes del backend:', err);
        }

        // 2) Second check if there is a pending invitation code in localStorage
        const pendingCode = localStorage.getItem('pending_invite_code');
        if (pendingCode) {
          try {
            const res = await fetch(`${API_URL}/shared/invite/${pendingCode}`);
            const resJson = await res.json();
            if (res.ok && resJson.success && resJson.data) {
              setInvitation({
                agencyName: resJson.data.agencyName,
                role: resJson.data.role,
                isLinkInvite: true,
                code: pendingCode,
              });
              setStep('details'); // Go directly to details
            }
          } catch (err) {
            console.warn('[Onboarding] Error al resolver código de enlace del backend:', err);
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
      const pendingCode = localStorage.getItem('pending_invite_code') || undefined;
      let completedSuccessfully = false;

      // 1. Intentar completar perfil mediante backend Express
      try {
        let url = `${API_URL}/users/complete-profile`;
        let bodyData = { fullName, agencyName, inviteCode: pendingCode, agencyType };

        // Si existe invitación directa por email
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
        if (response.ok) {
          completedSuccessfully = true;
        } else {
          // Si el servidor devolvió un error específico (ej: de validación), lo lanzamos sin hacer fallback
          if (response.status === 400 || response.status === 409) {
            throw new Error(data.message || 'Error al completar el perfil.');
          }
          throw new Error('Servidor inalcanzable');
        }
      } catch (fetchErr) {
        if (fetchErr.message && fetchErr.message !== 'Servidor inalcanzable' && !fetchErr.message.includes('Failed to fetch')) {
          throw fetchErr;
        }

        console.warn('[Onboarding] Servidor inalcanzable, ejecutando guardado directo en Supabase...');

        // 2. Fallback: Guardado directo en Supabase mediante RPCs
        let createdAgencyId = null;

        if (invitation && !invitation.isLinkInvite) {
          // Aceptar invitación directa
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('accept_agency_invitation', {
            user_full_name: fullName
          });
          if (rpcErr) throw rpcErr;
          createdAgencyId = rpcRes?.agencyId;
        } else if (invitation && invitation.isLinkInvite) {
          // Aceptar invitación de enlace
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('accept_agency_invite_link', {
            invite_code: invitation.code,
            user_full_name: fullName
          });
          if (rpcErr) throw rpcErr;
          createdAgencyId = rpcRes?.agencyId;
        } else {
          // Crear nueva agencia/negocio y perfil admin
          const { data: newAgencyId, error: rpcErr } = await supabase.rpc('create_new_agency_and_admin', {
            user_id: session.user.id,
            agency_name: agencyName,
            user_full_name: fullName,
            agency_type: agencyType
          });
          if (rpcErr) throw rpcErr;
          createdAgencyId = newAgencyId;

          // Auto-crear cliente para negocio propio
          if (agencyType === 'own_business' && createdAgencyId) {
            try {
              await supabase.from('clients').insert({
                agency_id: createdAgencyId,
                name: agencyName,
                industry: 'Mi Negocio',
                brand_info: { card_color: '#7C5CFC' },
              });
            } catch (clientErr) {
              console.warn('[Onboarding] Auto-creación de marca falló en fallback:', clientErr.message);
            }
          }
        }

        completedSuccessfully = true;
      }

      if (completedSuccessfully) {
        // Limpiar código de localStorage
        localStorage.removeItem('pending_invite_code');

        if (invitation) {
          toast.success('¡Te has unido exitosamente!');
        } else {
          toast.success(agencyType === 'agency' ? '¡Agencia creada exitosamente!' : '¡Negocio y marca inicializados!', { icon: '✨' });
        }
        onProfileComplete();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingInvitation) {
    return (
      <div className="min-h-screen text-text-primary flex items-center justify-center p-6 bg-[#07070E]">
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#7C5CFC]/30 border-b-[#7C5CFC] rounded-full animate-spin mb-4" />
          <div className="text-text-muted font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">Buscando invitaciones...</div>
        </div>
      </div>
    );
  }

  // Animation variants
  const stepVariants = {
    initial: { opacity: 0, scale: 0.97, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, y: -10 },
  };

  const transitionConfig = {
    type: 'spring',
    stiffness: 280,
    damping: 25,
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-[#07070E] overflow-hidden select-none">
      {/* Background Glowing Auras */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#7C5CFC]/12 blur-[120px] animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4ECDC4]/10 blur-[120px] animate-[pulse_12s_ease-in-out_infinite_2s]" />

      <div className="w-full max-w-[460px] rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative z-10 text-center">
        
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#FF6B6B] flex items-center justify-center font-black text-white text-xl shadow-[0_6px_16px_rgba(124,92,252,0.25)] mb-4">
            R
          </div>
          <h2 className="text-2xl font-title font-black text-white tracking-tight mb-2">
            {step === 'choice' ? '¿Cómo usarás Cadence?' : 'Completa tu registro'}
          </h2>
          <p className="text-xs text-text-muted/80 font-medium">
            {step === 'choice' 
              ? 'Elige la estructura que mejor se adapte a ti' 
              : '¡Bienvenido! Solo un paso más para empezar a trabajar.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP A: Role Selection (for non-invited users) */}
          {step === 'choice' && !invitation && (
            <motion.div
              key="choice"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transitionConfig}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4">
                {/* Agency option card */}
                <div
                  onClick={() => {
                    setAgencyType('agency');
                    setStep('details');
                  }}
                  className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
                    agencyType === 'agency'
                      ? 'border-[#7C5CFC] bg-[#7C5CFC]/[0.06] shadow-[0_0_25px_rgba(124,92,252,0.15)]'
                      : 'border-white/[0.06] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                      agencyType === 'agency' 
                        ? 'bg-[#7C5CFC]/20 text-[#7C5CFC]' 
                        : 'bg-white/5 text-text-secondary'
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black text-white group-hover:text-[#7C5CFC] transition-colors leading-tight mb-1">
                        Agencia de Marketing
                      </h4>
                      <p className="text-[11.5px] leading-relaxed text-text-muted">
                        Para profesionales, agencias o equipos que gestionan múltiples marcas de clientes independientes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Own business option card */}
                <div
                  onClick={() => {
                    setAgencyType('own_business');
                    setStep('details');
                  }}
                  className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${
                    agencyType === 'own_business'
                      ? 'border-[#4ECDC4] bg-[#4ECDC4]/[0.05] shadow-[0_0_25px_rgba(78,205,196,0.15)]'
                      : 'border-white/[0.06] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                      agencyType === 'own_business' 
                        ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]' 
                        : 'bg-white/5 text-text-secondary'
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.571V11m.667-.324a3 3 0 11-4-4 3 3 0 014 4zM12 11c0-3.517 1.009-6.799 2.753-9.571m-3.44 2.04l-.054.09A13.916 13.916 0 0115 11.571V11m-.667-.324a3 3 0 10-4-4 3 3 0 004 4z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black text-white group-hover:text-[#4ECDC4] transition-colors leading-tight mb-1">
                        Negocio Propio / Marca
                      </h4>
                      <p className="text-[11.5px] leading-relaxed text-text-muted">
                        Para creadores, empresas o marcas únicas que planifican y gestionan su propio contenido interno.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP B: Details Input Form */}
          {step === 'details' && (
            <motion.div
              key="details"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transitionConfig}
            >
              {invitation && (
                <div className="mb-5 rounded-2xl border border-[#7C5CFC]/20 bg-[#7C5CFC]/5 p-4 backdrop-blur-md text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-pulse">✨</span>
                    <div>
                      <h4 className="font-extrabold text-white text-xs">¡Invitación Encontrada!</h4>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                        Has sido invitado a unirte a la agencia{' '}
                        <span className="font-black text-[#7C5CFC]">{invitation.agencyName}</span>. 
                        Solo ingresa tu nombre completo para ingresar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleCompleteProfile} className="space-y-4 text-left">
                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-[10px] font-black text-text-muted uppercase tracking-wider pl-1">
                    Tu nombre completo
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                {!invitation && (
                  <div>
                    <label htmlFor="agencyName" className="mb-1.5 block text-[10px] font-black text-text-muted uppercase tracking-wider pl-1">
                      {agencyType === 'agency' ? 'Nombre de tu agencia' : 'Nombre de tu negocio / marca'}
                    </label>
                    <input
                      id="agencyName"
                      type="text"
                      value={agencyName}
                      onChange={e => setAgencyName(e.target.value)}
                      className={inputClass}
                      placeholder={agencyType === 'agency' ? 'Ej: Mi Agencia Digital' : 'Ej: Café Central'}
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={primaryBtn}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Procesando...
                    </span>
                  ) : invitation ? (
                    'Aceptar Invitación y Unirse'
                  ) : agencyType === 'agency' ? (
                    'Crear Agencia Digital'
                  ) : (
                    'Inicializar Espacio de Marca'
                  )}
                </button>

                {/* Back button */}
                {!invitation && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('choice')}
                      className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors underline"
                    >
                      Elegir otro rol
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
