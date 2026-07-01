import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { EnvelopeIcon, UserPlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../../api/apiFetch';
import { useModalGsap } from '../../hooks/useModalGsap';
import { useLanguage, useEscapeClose } from '../../hooks';

export const MemberInvitationModal = ({ isOpen, onClose }) => {
  const backdropRef = useRef(null);
  const modalPanelRef = useRef(null);
  const { lang, t } = useLanguage();

  // Call premium GSAP modal transition hook
  useModalGsap(isOpen, backdropRef, modalPanelRef);
  useEscapeClose(isOpen, onClose);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Reset al abrir o cerrar
  useEffect(() => {
    if (isOpen) {
      setInviteEmail('');
      setInviteRole('member');
      setSendingInvite(false);
    }
  }, [isOpen]);

  const handleSendInvitation = async e => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error(lang === 'es' ? 'Por favor ingresa un correo electrónico.' : 'Please enter an email address.');
      return;
    }

    setSendingInvite(true);
    try {
      const res = await apiFetch('/invitations', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      toast.success(t.dashboard.inviteSuccess || '¡Invitación enviada exitosamente!');
      onClose();
    } catch (err) {
      toast.error(err.message || (lang === 'es' ? 'Error al enviar la invitación.' : 'Error sending invitation.'));
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter=''
          enterFrom=''
          enterTo=''
          leave='ease-in duration-150'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div ref={backdropRef} className='fixed inset-0 bg-black/60 backdrop-blur-sm' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter=''
              enterFrom=''
              enterTo=''
              leave='ease-in duration-150'
              leaveFrom='opacity-100 scale-100 y-0'
              leaveTo='opacity-0 scale-95 y-4'
            >
              <Dialog.Panel ref={modalPanelRef} className='w-full max-w-md rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-6 shadow-2xl'>
                <Dialog.Title className='text-xl font-bold text-[color:var(--color-text-primary)] mb-2 flex items-center gap-2.5'>
                  <UserPlusIcon className='h-6 w-6 text-[color:var(--color-accent-blue)]' />
                  <span>{t.dashboard.inviteTitle || 'Invitar Nuevo Miembro'}</span>
                </Dialog.Title>
                <p className='text-xs text-[color:var(--color-text-muted)] mb-5'>
                  {t.dashboard.inviteDesc || 'Envía una invitación por correo electrónico para que se unan a tu agencia con un rol específico.'}
                </p>

                <form onSubmit={handleSendInvitation} className='space-y-4'>
                  <div className='space-y-1.5'>
                    <label
                      htmlFor='member-email'
                      className='block text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]'
                    >
                      {t.dashboard.emailLabel || 'Correo Electrónico'}
                    </label>
                    <div className='relative'>
                      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                        <EnvelopeIcon className='h-5 w-5 text-gray-500' aria-hidden='true' />
                      </div>
                      <input
                        type='email'
                        id='member-email'
                        placeholder={t.dashboard.emailPlaceholder || 'colaborador@email.com'}
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                        className='input-cyber pl-10'
                        disabled={sendingInvite}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='block text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]'>
                      {t.dashboard.roleLabel || 'Rol Asignado'}
                    </label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className='w-full bg-[color:var(--color-surface-soft)] border border-[color:var(--color-border-subtle)] rounded-xl px-4 py-3 text-xs text-[color:var(--color-text-primary)] font-bold focus:border-[color:var(--color-border-strong)] focus:outline-none transition-colors'
                      disabled={sendingInvite}
                    >
                      <option value='CM'>CM (Community Manager)</option>
                      <option value='diseñador'>{lang === 'es' ? 'Diseñador' : 'Designer'}</option>
                      <option value='creativo'>{lang === 'es' ? 'Creativo' : 'Creative'}</option>
                      <option value='cuentas'>{lang === 'es' ? 'Cuentas' : 'Accounts'}</option>
                      <option value='admin'>{lang === 'es' ? 'Administrador' : 'Administrator'}</option>
                      <option value='member'>{lang === 'es' ? 'Miembro General' : 'General Member'}</option>
                    </select>
                    <p className='text-[10px] text-[color:var(--color-text-muted)] mt-1 px-1 leading-relaxed font-medium'>
                      {inviteRole === 'CM' && (lang === 'es' ? 'Acceso al inbox de CM y Meta Ads en modo lectura.' : 'Read-only access to CM inbox and Meta Ads.')}
                      {inviteRole === 'diseñador' && (lang === 'es' ? 'Acceso completo al Estudio de Diseño y lectura al Cronograma.' : 'Full access to Design Studio and read-only access to Schedule.')}
                      {inviteRole === 'creativo' && (lang === 'es' ? 'Acceso de escritura al Cronograma, copies, voz de marca e Identidad.' : 'Write access to Schedule, copies, brand voice and Identity.')}
                      {inviteRole === 'cuentas' && (lang === 'es' ? 'Gestión de clientes, cronograma, identidad y diseños. Sin invitación.' : 'Management of clients, schedule, identity and designs. No team settings access.')}
                      {inviteRole === 'admin' && (lang === 'es' ? 'Privilegios de administrador. Acceso total a la agencia y equipo.' : 'Administrator privileges. Full access to the agency and team.')}
                      {inviteRole === 'member' && (lang === 'es' ? 'Rol por defecto. Acceso básico de lectura/escritura.' : 'Default role. Basic read/write access.')}
                    </p>
                  </div>

                  <div className='flex justify-end gap-3 pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                    <button
                      type='button'
                      onClick={onClose}
                      className='btn-cyber border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-soft)]'
                      disabled={sendingInvite}
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type='submit'
                      disabled={sendingInvite}
                      className='px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_rgba(14,165,233,0.3)] active:scale-[0.98] min-w-[140px] flex items-center justify-center gap-1.5 cursor-pointer'
                    >
                      {sendingInvite ? (
                        <>
                          <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                          <span>{t.dashboard.inviting || 'Enviando...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.dashboard.sendInviteBtn || 'Enviar Invitación'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
