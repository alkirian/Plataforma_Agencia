import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export const ClientRenameModal = ({ isOpen, onClose, initialName = '', onSubmit, isSubmitting }) => {
  const [name, setName] = useState(initialName);
  useEffect(() => { setName(initialName); }, [initialName]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (name && name.trim()) onSubmit?.(name.trim());
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child as={Fragment} enter='ease-out duration-100' enterFrom='opacity-0' enterTo='opacity-100' leave='ease-in duration-75' leaveFrom='opacity-100' leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-black/40' />
        </Transition.Child>
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <Transition.Child as={Fragment} enter='ease-out duration-100' enterFrom='opacity-0 scale-95' enterTo='opacity-100 scale-100' leave='ease-in duration-75' leaveFrom='opacity-100 scale-100' leaveTo='opacity-0 scale-95'>
            <Dialog.Panel className='w-full max-w-md rounded-xl border border-[color:var(--color-border-subtle)] bg-surface-strong p-6 shadow-xl'>
              <Dialog.Title className='mb-2 text-lg font-semibold text-text-primary'>Renombrar cliente</Dialog.Title>
              <p className='mb-4 text-sm text-text-muted'>Este cambio se aplica para todos los miembros de la agencia.</p>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <input
                  autoFocus
                  type='text'
                  className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Nombre del cliente'
                />
                <div className='flex justify-end gap-2'>
                  <button type='button' className='btn-cyber !bg-transparent border border-[color:var(--color-border-subtle)]' onClick={onClose}>Cancelar</button>
                  <button type='submit' disabled={isSubmitting || !name?.trim()} className='btn-cyber'>Guardar</button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

