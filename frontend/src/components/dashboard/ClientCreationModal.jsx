import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';

export const ClientCreationModal = ({ isOpen, onClose, onCreate, isSubmitting }) => {
  const { register, handleSubmit, reset } = useForm();

  const submit = (data) => {
    onCreate({ name: data.name, industry: data.industry });
    reset();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md rounded-xl border border-white/10 bg-glow-card-bg p-6 backdrop-blur-lg shadow-lg">
                <Dialog.Title className="mb-2 text-lg font-semibold text-white">Nuevo cliente</Dialog.Title>
                <form onSubmit={handleSubmit(submit)} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-rambla-text-secondary">Nombre</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none"
                      placeholder="Nombre del cliente"
                      {...register('name', { required: true })}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-rambla-text-secondary">Industria (opcional)</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none"
                      placeholder="Industria"
                      {...register('industry')}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="rounded-md border border-rambla-border px-4 py-2 text-sm text-rambla-text-secondary hover:border-rambla-accent">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                      {isSubmitting ? 'Creando…' : 'Crear'}
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
