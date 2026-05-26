import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { EnvelopeIcon, UserPlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../../api/apiFetch';

export const MemberInvitationModal = ({ isOpen, onClose }) => {
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
      toast.error('Por favor ingresa un correo electrónico.');
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

      toast.success('¡Invitación enviada exitosamente!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al enviar la invitación.');
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-200'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-150'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/60 backdrop-blur-sm' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-250'
              enterFrom='opacity-0 scale-95 y-4'
              enterTo='opacity-100 scale-100 y-0'
              leave='ease-in duration-150'
              leaveFrom='opacity-100 scale-100 y-0'
              leaveTo='opacity-0 scale-95 y-4'
            >
              <Dialog.Panel className='w-full max-w-md rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)] p-6 shadow-2xl transition-all'>
                <Dialog.Title className='text-xl font-bold text-white mb-2 flex items-center gap-2.5'>
                  <UserPlusIcon className='h-6 w-6 text-[color:var(--color-accent-blue)]' />
                  <span>Invitar Nuevo Miembro</span>
                </Dialog.Title>
                <p className='text-xs text-[color:var(--color-text-muted)] mb-5'>
                  Envía una invitación por correo electrónico para que se unan a tu agencia con un
                  rol específico.
                </p>

                <form onSubmit={handleSendInvitation} className='space-y-4'>
                  <div className='space-y-1.5'>
                    <label
                      htmlFor='member-email'
                      className='block text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]'
                    >
                      Correo Electrónico
                    </label>
                    <div className='relative'>
                      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                        <EnvelopeIcon className='h-5 w-5 text-gray-500' aria-hidden='true' />
                      </div>
                      <input
                        type='email'
                        id='member-email'
                        placeholder='colaborador@email.com'
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
                      Rol Asignado
                    </label>
                    <div className='grid grid-cols-2 gap-3'>
                      <button
                        type='button'
                        onClick={() => setInviteRole('member')}
                        className={`px-4 py-3 text-xs font-bold rounded-xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                          inviteRole === 'member'
                            ? 'bg-[color:var(--color-accent-blue)]/10 border-[color:var(--color-accent-blue)] text-[color:var(--color-accent-blue)] shadow-md'
                            : 'bg-[#222024] border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)] hover:border-gray-500 hover:text-white'
                        }`}
                        disabled={sendingInvite}
                      >
                        <span className='text-sm'>👤</span>
                        <span>Miembro</span>
                      </button>
                      <button
                        type='button'
                        onClick={() => setInviteRole('admin')}
                        className={`px-4 py-3 text-xs font-bold rounded-xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                          inviteRole === 'admin'
                            ? 'bg-[color:var(--color-accent-rose)]/10 border-[color:var(--color-accent-rose)] text-[color:var(--color-accent-rose)] shadow-md'
                            : 'bg-[#222024] border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)] hover:border-gray-500 hover:text-white'
                        }`}
                        disabled={sendingInvite}
                      >
                        <ShieldCheckIcon className='h-4 w-4' />
                        <span>Administrador</span>
                      </button>
                    </div>
                  </div>

                  <div className='flex justify-end gap-3 pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                    <button
                      type='button'
                      onClick={onClose}
                      className='btn-cyber border border-transparent text-[color:var(--color-text-muted)] hover:text-white hover:bg-[color:var(--color-surface)]'
                      disabled={sendingInvite}
                    >
                      Cancelar
                    </button>
                    <button
                      type='submit'
                      disabled={sendingInvite}
                      className='btn-cyber btn-tone btn-tone--blue min-w-[140px] flex items-center justify-center gap-1.5 font-bold'
                    >
                      {sendingInvite ? (
                        <>
                          <span className='h-4 w-4 animate-spin rounded-full border-2 border-[#161517] border-t-transparent' />
                          <span>Invitando…</span>
                        </>
                      ) : (
                        <>
                          <span>Enviar Invitación</span>
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
