import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ClipboardIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  SparklesIcon,
  UserPlusIcon,
  ClockIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getApiUrl } from '@api/apiFetch';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { CyberButton } from '../ui/Button';
import { sqlSetupCode } from '../../constants/settingsSqlTemplates';

const getRoleBadgeStyle = (roleStr) => {
  const r = String(roleStr || '').toLowerCase();
  switch (r) {
    case 'admin':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'cuentas':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'creativo':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'diseñador':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'cm':
      return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  }
};

export const TeamTab = ({ profile, session, t, lang }) => {
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

  const apiBaseUrl = getApiUrl();

  const copyToClipboard = code => {
    navigator.clipboard.writeText(code);
    toast.success('Copiado al portapapeles!');
  };

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
        headers: { Authorization: `Bearer ${token}` },
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
          headers: { Authorization: `Bearer ${token}` },
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
            headers: { Authorization: `Bearer ${token}` },
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
    if (profile) {
      fetchAgencyData();
    }
  }, [profile]);

  const handleSendInvitation = async e => {
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
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

  const handleCancelInvitation = async invitationId => {
    if (!window.confirm('¿Cancelar esta invitación?')) return;

    setCancelingInviteId(invitationId);
    const token = session?.access_token || localStorage.getItem('authToken');

    try {
      const res = await fetch(`${apiBaseUrl}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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
    const confirmationMsg =
      lang === 'es'
        ? '¿Estás seguro de que deseas regenerar el enlace? El enlace anterior dejará de funcionar inmediatamente.'
        : 'Are you sure you want to regenerate the invite link? The previous link will stop working immediately.';

    if (!window.confirm(confirmationMsg)) return;

    setRegeneratingLink(true);
    const token = session?.access_token || localStorage.getItem('authToken');

    try {
      const res = await fetch(`${apiBaseUrl}/invitations/links/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error');

      toast.success(
        lang === 'es'
          ? '¡Enlace de invitación de la agencia regenerado!'
          : 'Agency invitation link regenerated!'
      );
      setInviteLinkCode(result.data.code);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegeneratingLink(false);
    }
  };

  return (
    <div className='space-y-6'>
      {isDbTableMissing ? (
        <Card className='border border-red-500/20 bg-red-950/5'>
          <CardHeader>
            <CardTitle className='text-red-400 flex items-center gap-2'>
              <ExclamationTriangleIcon className='h-6 w-6 text-red-500' />
              {t.team.dbMissingTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 pt-2'>
            <p className='text-xs text-text-primary leading-relaxed'>
              {t.team.dbMissingDesc}
            </p>

            <div className='relative mt-2 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-red-400/90 p-4 max-h-48 overflow-y-auto'>
              <pre className='whitespace-pre-wrap'>{sqlSetupCode}</pre>
              <button
                type='button'
                onClick={() => copyToClipboard(sqlSetupCode)}
                className='absolute top-2 right-2 p-1.5 rounded bg-surface border border-white/10 text-white hover:bg-surface-strong transition'
                title='Copiar SQL'
              >
                <ClipboardIcon className='h-4 w-4' />
              </button>
            </div>
            <div className='flex gap-4 pt-2'>
              <CyberButton onClick={() => copyToClipboard(sqlSetupCode)} size='sm'>
                Copiar Código SQL
              </CyberButton>
              <CyberButton onClick={fetchAgencyData} size='sm'>
                Reintentar
              </CyberButton>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className='surface p-0 overflow-hidden'>
          <div className='p-6 border-b border-border-subtle bg-gradient-to-r from-surface-strong to-surface-soft/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3'>
            <div>
              <h2 className='text-lg font-bold text-text-primary flex items-center gap-2'>
                <UserGroupIcon className='h-5 w-5' />
                {t.team.title}
              </h2>
              <p className='text-xs text-text-muted mt-1'>{t.team.desc}</p>
            </div>

            {profile?.role !== 'admin' && (
              <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 max-w-max'>
                <ExclamationTriangleIcon className='h-3.5 w-3.5 animate-pulse' />
                {lang === 'es' ? 'Solo Lectura' : 'Read Only'}
              </span>
            )}
          </div>

          <div className='p-6 space-y-6'>
            {profile?.role !== 'admin' && (
              <div className='rounded-xl border border-border-subtle bg-surface-soft/40 p-4 text-xs text-text-muted leading-relaxed'>
                {lang === 'es'
                  ? 'Como miembro, puedes ver el equipo activo pero necesitas privilegios de Administrador para invitar a nuevos colaboradores.'
                  : 'As a member, you can view the active team, but you need Administrator privileges to dispatch collaborator invites.'}
              </div>
            )}

            <div className={`grid grid-cols-1 ${profile?.role === 'admin' ? 'lg:grid-cols-5' : ''} gap-6`}>
              {/* Listado de Miembros */}
              <div className={`${profile?.role === 'admin' ? 'lg:col-span-3' : 'w-full'} space-y-4`}>
                <h3 className='text-sm font-semibold text-text-primary'>
                  {t.team.members} ({members.length})
                </h3>

                {loadingMembers ? (
                  <div className='py-12 text-center text-text-muted text-xs flex flex-col items-center justify-center gap-3 font-medium'>
                    <ArrowPathIcon className='h-5 w-5 animate-spin' />
                    {lang === 'es' ? 'Cargando equipo...' : 'Loading active team...'}
                  </div>
                ) : members.length === 0 ? (
                  <div className='py-8 text-center text-xs text-text-muted rounded-xl border border-dashed border-border-subtle bg-surface-soft/20'>
                    {t.team.noMembers}
                  </div>
                ) : (
                  <div className='space-y-2.5 max-h-[360px] overflow-y-auto pr-1'>
                    {members.map(member => (
                      <div
                        key={member.id}
                        className='flex items-center justify-between p-3 rounded-xl bg-surface-soft/60 border border-border-subtle hover:border-border-strong transition duration-200'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='h-8 w-8 rounded-full bg-surface-strong border border-border-subtle flex items-center justify-center font-bold text-xs text-text-primary uppercase'>
                            {member.fullName?.charAt(0) || 'U'}
                          </div>
                          <div className='space-y-0.5'>
                            <h4 className='font-semibold text-text-primary text-xs flex items-center gap-1.5'>
                              {member.fullName}
                              {member.id === profile?.id && (
                                <span className='text-[10px] text-text-muted'>
                                  (Tú)
                                </span>
                              )}
                            </h4>
                            <span className='text-[10px] text-text-muted flex items-center gap-1'>
                              <EnvelopeIcon className='h-3 w-3' />
                              {member.email}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${getRoleBadgeStyle(member.role)}`}
                        >
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invitaciones */}
              {profile?.role === 'admin' && (
                <div className='lg:col-span-2 space-y-6'>
                  {/* Enlace Compartido de Invitación */}
                  <div className='rounded-xl border border-border-subtle bg-surface-soft/30 p-4 space-y-4'>
                    <h3 className='text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5'>
                      <SparklesIcon className='h-4 w-4 text-primary-400' />
                      {lang === 'es' ? 'Enlace de Invitación' : 'Invitation Link'}
                    </h3>
                    <p className='text-[11px] text-text-muted leading-relaxed'>
                      {lang === 'es'
                        ? 'Cualquier persona con este enlace podrá unirse automáticamente a tu agencia.'
                        : 'Anyone with this link can automatically join your agency.'}
                    </p>

                    <div className='flex gap-2'>
                      <div className='flex-1 bg-black/30 border border-border-subtle rounded-xl px-3 py-2 text-xs font-mono text-text-primary overflow-x-auto whitespace-nowrap scrollbar-none select-all flex items-center'>
                        {inviteLinkCode
                          ? window.location.origin + '/join/' + inviteLinkCode
                          : lang === 'es'
                            ? 'Generando...'
                            : 'Generating...'}
                      </div>
                      <button
                        type='button'
                        onClick={() =>
                          copyToClipboard(
                            inviteLinkCode
                              ? window.location.origin + '/join/' + inviteLinkCode
                              : ''
                          )
                        }
                        className='p-2 rounded-xl border border-border-subtle hover:bg-surface-strong text-text-primary transition'
                        title={lang === 'es' ? 'Copiar Enlace' : 'Copy Link'}
                        disabled={!inviteLinkCode}
                      >
                        <ClipboardIcon className='h-4 w-4' />
                      </button>
                    </div>

                    <div className='flex justify-end pt-1'>
                      <button
                        type='button'
                        onClick={handleRegenerateLink}
                        disabled={
                          regeneratingLink || loadingInviteLink || !inviteLinkCode
                        }
                        className='text-[10px] font-bold text-text-muted hover:text-text-primary flex items-center gap-1 transition'
                      >
                        <ArrowPathIcon
                          className={`h-3 w-3 ${regeneratingLink ? 'animate-spin' : ''}`}
                        />
                        {lang === 'es' ? 'Regenerar enlace' : 'Regenerate link'}
                      </button>
                    </div>
                  </div>

                  {/* Formulario */}
                  <div className='rounded-xl border border-border-subtle bg-surface-soft/30 p-4 space-y-4'>
                    <h3 className='text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5'>
                      <UserPlusIcon className='h-4 w-4' />
                      {t.team.inviteTitle}
                    </h3>
                    <form onSubmit={handleSendInvitation} className='space-y-4'>
                      <div>
                        <label className='block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5'>
                          {t.team.emailLabel}
                        </label>
                        <Input
                          type='email'
                          placeholder='nombre@empresa.com'
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          required
                          className='input-cyber text-xs py-2'
                          disabled={sendingInvite}
                        />
                      </div>

                      <div>
                        <label className='block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2'>
                          {t.team.roleLabel}
                        </label>
                        <select
                          value={inviteRole}
                          onChange={e => setInviteRole(e.target.value)}
                          className='w-full bg-surface border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-semibold focus:border-border-strong focus:outline-none transition-colors'
                        >
                          <option value='CM'>CM (Community Manager)</option>
                          <option value='diseñador'>{lang === 'es' ? 'Diseñador' : 'Designer'}</option>
                          <option value='creativo'>{lang === 'es' ? 'Creativo' : 'Creative'}</option>
                          <option value='cuentas'>{lang === 'es' ? 'Cuentas' : 'Account Manager'}</option>
                          <option value='admin'>Admin</option>
                          <option value='member'>{lang === 'es' ? 'Miembro General' : 'General Member'}</option>
                        </select>
                        <p className='text-[10.5px] text-text-muted mt-2 px-1 leading-relaxed font-medium'>
                          {inviteRole === 'CM' && (lang === 'es' ? 'Acceso al inbox de CM y Meta Ads en modo lectura.' : 'Read-only access to CM inbox and Meta Ads.')}
                          {inviteRole === 'diseñador' && (lang === 'es' ? 'Acceso completo al Estudio de Diseño y lectura al Cronograma.' : 'Full access to Design Studio and read-only to Schedule.')}
                          {inviteRole === 'creativo' && (lang === 'es' ? 'Acceso de escritura al Cronograma, copies, voz de marca e Identidad.' : 'Write access to Schedule, copywriting, brand voice and Identity.')}
                          {inviteRole === 'cuentas' && (lang === 'es' ? 'Gestión de clientes, cronograma, identidad y diseños. Sin invitación.' : 'Manage clients, schedule, identity, and designs. No team invite.')}
                          {inviteRole === 'admin' && (lang === 'es' ? 'Privilegios de administrador. Acceso total a la agencia y equipo.' : 'Administrator privileges. Full access to agency and team.')}
                          {inviteRole === 'member' && (lang === 'es' ? 'Rol por defecto. Acceso básico de lectura/escritura.' : 'Default role. Basic read/write access.')}
                        </p>
                      </div>

                      <button
                        type='submit'
                        disabled={sendingInvite}
                        className='w-full btn-cyber text-xs font-semibold py-2'
                      >
                        {sendingInvite ? '...' : t.team.inviteBtn}
                      </button>
                    </form>
                  </div>

                  {/* Lista de Invitaciones */}
                  <div className='space-y-3.5'>
                    <h3 className='text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5'>
                      <ClockIcon className='h-4 w-4' />
                      {t.team.invites} ({pendingInvitations.length})
                    </h3>

                    {loadingInvites ? (
                      <div className='py-4 text-center text-text-muted text-xs animate-pulse'>
                        ...
                      </div>
                    ) : pendingInvitations.length === 0 ? (
                      <div className='py-5 text-center text-[11px] text-text-muted rounded-xl border border-dashed border-border-subtle bg-surface-soft/10'>
                        {t.team.noInvites}
                      </div>
                    ) : (
                      <div className='space-y-2 max-h-[160px] overflow-y-auto pr-1'>
                        {pendingInvitations.map(inv => (
                          <div
                            key={inv.id}
                            className='flex items-center justify-between p-2.5 rounded-xl bg-surface-soft/40 border border-border-subtle'
                          >
                            <div className='space-y-0.5 min-w-0'>
                              <h4 className='font-semibold text-text-primary text-xs truncate max-w-[140px]'>
                                {inv.email}
                              </h4>
                              <span className='text-[10px] text-text-muted capitalize'>
                                {inv.role === 'admin'
                                  ? t.team.adminRole
                                  : t.team.memberRole}
                              </span>
                            </div>

                            <button
                              type='button'
                              onClick={() => handleCancelInvitation(inv.id)}
                              disabled={cancelingInviteId === inv.id}
                              className='p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition'
                              title='Cancelar'
                            >
                              {cancelingInviteId === inv.id ? (
                                <ArrowPathIcon className='h-3 w-3 animate-spin' />
                              ) : (
                                <TrashIcon className='h-3.5 w-3.5' />
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
  );
};
