import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { createClient } from '../../api/clients';

const SUGGESTED_INDUSTRIES = [
  'Gastronomía',
  'Moda y Belleza',
  'Tecnología',
  'Salud y Fitness',
  'E-commerce',
  'Inmobiliaria',
  'Educación',
  'Servicios',
];

export const ClientCreationModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Datos de formulario
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');

  // Filtrado de industrias sugeridas (solo muestra si el usuario está escribiendo y coincide)
  const filteredIndustries =
    clientIndustry.trim() === ''
      ? []
      : SUGGESTED_INDUSTRIES.filter(
          ind =>
            ind.toLowerCase().includes(clientIndustry.toLowerCase()) &&
            ind.toLowerCase() !== clientIndustry.trim().toLowerCase()
        );

  // Reset del formulario al cerrar o abrir
  useEffect(() => {
    if (isOpen) {
      setClientName('');
      setClientIndustry('');
    }
  }, [isOpen]);

  // MUTACIONES DE REACT QUERY
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: response => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      // La API retorna el UUID del cliente en response.data o directamente
      const rawData = response?.data || response;
      const clientId = typeof rawData === 'string' ? rawData : rawData?.id || rawData;

      toast.success(`Cliente "${clientName.trim()}" creado con éxito.`);
      onClose();
      // Redirigir directamente a la ficha del cliente
      navigate(`/clients/${clientId}`);
    },
    onError: error => {
      toast.error(error.message || 'No se pudo crear el cliente.');
    },
  });

  const handleSubmit = e => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Por favor escribe un nombre.');
      return;
    }
    createClientMutation.mutate({
      name: clientName.trim(),
      industry: clientIndustry.trim() || null,
    });
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
                <Dialog.Title className='text-xl font-bold text-white mb-6 flex items-center gap-2'>
                  <span>Añadir Cliente</span>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className='space-y-5'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]'>
                      Nombre del Cliente <span className='text-red-400'>*</span>
                    </label>
                    <input
                      type='text'
                      className='input-cyber'
                      placeholder='Ej: Cafe Store, Nike Argentina'
                      value={clientName || ''}
                      onChange={e => setClientName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className='space-y-1.5 relative'>
                    <label className='text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]'>
                      Sector o Industria (Opcional)
                    </label>
                    <div className='relative'>
                      <input
                        type='text'
                        className='input-cyber w-full'
                        placeholder='Ej: Gastronomía, Moda...'
                        value={clientIndustry || ''}
                        onChange={e => setClientIndustry(e.target.value)}
                      />

                      {/* Sugerencias Rápidas Filtradas (se muestran al escribir) */}
                      {filteredIndustries.length > 0 && (
                        <div className='absolute z-10 left-0 right-0 mt-1.5 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)]/95 backdrop-blur-md shadow-2xl max-h-48 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin'>
                          {filteredIndustries.map(ind => (
                            <button
                              key={ind}
                              type='button'
                              onClick={() => setClientIndustry(ind)}
                              className='w-full text-left px-4 py-2.5 text-xs font-semibold text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent-sage)] hover:bg-white/[0.03] transition-all flex items-center justify-between group'
                            >
                              <span>{ind}</span>
                              <span className='opacity-0 group-hover:opacity-100 text-[10px] text-[color:var(--color-text-muted)] transition-opacity font-normal'>
                                Autocompletar ↵
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex justify-end gap-3 pt-4 border-t border-[color:var(--color-border-subtle)] mt-6'>
                    <button
                      type='button'
                      onClick={onClose}
                      className='btn-cyber border border-transparent text-[color:var(--color-text-muted)] hover:text-white hover:bg-[color:var(--color-surface)]'
                    >
                      Cancelar
                    </button>
                    <button
                      type='submit'
                      disabled={createClientMutation.isPending}
                      className='btn-cyber btn-tone btn-tone--green min-w-[120px] flex items-center justify-center gap-1.5 font-bold'
                    >
                      {createClientMutation.isPending ? (
                        <>
                          <span className='h-4 w-4 animate-spin rounded-full border-2 border-[#161517] border-t-transparent' />
                          <span>Guardando…</span>
                        </>
                      ) : (
                        <span>Guardar</span>
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
