import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getTrashClients, restoreClient } from '../../api/clients';
import {
  ArrowUturnLeftIcon,
  TrashIcon,
  ClockIcon,
  CalendarIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

export const TrashTab = ({ t, lang = 'es' }) => {
  const queryClient = useQueryClient();

  // Consultar clientes en la papelera
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['trash-clients'],
    queryFn: getTrashClients,
  });

  const trashClients = response?.data || [];

  // Mutación para restaurar un cliente
  const restoreMutation = useMutation({
    mutationFn: restoreClient,
    onSuccess: (res, clientId) => {
      toast.success(
        lang === 'es'
          ? 'Cliente restaurado correctamente.'
          : 'Client restored successfully.'
      );
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['trash-clients'] });
      // Disparar evento para actualizar otras partes del sistema si es necesario
      window.dispatchEvent(new CustomEvent('cadence:client-restored', { detail: clientId }));
    },
    onError: (error) => {
      console.error('Error al restaurar cliente:', error);
      toast.error(
        lang === 'es'
          ? 'Error al restaurar el cliente: ' + error.message
          : 'Failed to restore client: ' + error.message
      );
    },
  });

  // Calcular días restantes
  const getRemainingDays = (deletedAtString) => {
    if (!deletedAtString) return 7;
    const deletedAt = new Date(deletedAtString);
    const now = new Date();
    const diffTime = now - deletedAt;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 7 - diffDays;
    return remaining > 0 ? remaining : 0;
  };

  const handleRestore = (client) => {
    restoreMutation.mutate(client.id);
  };

  const formatDeletedDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const colors = ['#FF6B6B', '#4ECDC4', '#7C5CFC', '#FFD166', '#68D391', '#F06292'];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded" />
        <div className="h-32 w-full bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <TrashIcon className="h-5 w-5 text-red-500" />
            <span>{lang === 'es' ? 'Papelera de Clientes' : 'Clients Trash'}</span>
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {lang === 'es'
              ? 'Los clientes eliminados se conservan por 7 días como copia de seguridad antes de eliminarse de forma permanente.'
              : 'Deleted clients are kept for 7 days as a backup before being permanently deleted.'}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400">
          {trashClients.length} {lang === 'es' ? 'eliminados' : 'deleted'}
        </span>
      </div>

      {trashClients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-dashed border-border-subtle rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-surface-soft/25"
        >
          <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-text-muted mb-4 shadow-sm">
            <TrashIcon className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-text-primary">
            {lang === 'es' ? 'La papelera está vacía' : 'Trash is empty'}
          </h4>
          <p className="text-xs text-text-muted max-w-xs mx-auto mt-1.5 leading-relaxed">
            {lang === 'es'
              ? 'No hay clientes eliminados en este momento. Los que elimines aparecerán aquí por una semana.'
              : 'No deleted clients found. Clients you delete will show up here for one week.'}
          </p>
        </motion.div>
      ) : (
        <div className="overflow-hidden border border-border-subtle rounded-2xl bg-surface divide-y divide-border-subtle shadow-sm">
          {trashClients.map((client, idx) => {
            const remainingDays = getRemainingDays(client.deleted_at);
            const initials = (client.name || 'CL').substring(0, 2).toUpperCase();
            const brandColor = client.logo_url ? null : colors[idx % colors.length];

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-surface-soft/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  {client.logo_url ? (
                    <img
                      src={client.logo_url}
                      alt={client.name}
                      className="w-10 h-10 rounded-xl object-cover border border-border-subtle flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{
                        backgroundColor: brandColor + '20',
                        border: `1px solid ${brandColor}40`,
                        color: brandColor,
                      }}
                    >
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-text-primary truncate">{client.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-text-muted">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>
                          {lang === 'es' ? 'Eliminado el:' : 'Deleted on:'}{' '}
                          {formatDeletedDate(client.deleted_at)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none border-border-subtle/50 pt-3 sm:pt-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full">
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>
                      {remainingDays === 1
                        ? lang === 'es'
                          ? '1 día restante'
                          : '1 day left'
                        : lang === 'es'
                        ? `${remainingDays} días restantes`
                        : `${remainingDays} days left`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(client)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50"
                    disabled={restoreMutation.isPending}
                    title={lang === 'es' ? 'Restaurar cliente' : 'Restore client'}
                  >
                    <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                    <span>{lang === 'es' ? 'Restaurar' : 'Restore'}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
