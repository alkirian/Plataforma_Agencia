import React from 'react';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { Link } from 'react-router-dom';
import { DocumentArrowUpIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';

const typeMeta = {
  DOCUMENT_UPLOADED: {
    icon: DocumentArrowUpIcon,
    text: (actor, client, meta) => `${actor} subió "${meta?.file_name || 'un archivo'}" en ${client}`,
  },
  DOCUMENT_DELETED: {
    icon: TrashIcon,
    text: (actor, client, meta) => `${actor} eliminó "${meta?.file_name || 'un archivo'}" en ${client}`,
  },
  SCHEDULE_ITEM_CREATED: {
    icon: CalendarIcon,
    text: (actor, client, meta) => `${actor} creó "${meta?.title || 'un evento'}" en ${client}`,
  },
};

const timeAgo = (iso) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d2 = Math.floor(h / 24);
  return `hace ${d2}d`;
};

export const ActivityFeed = ({ limit = 20 }) => {
  const { items, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useActivityFeed({ limit });

  return (
    <section className="space-y-4">
      <div className="relative">
        <div className="mx-auto mb-4 h-px w-full border-t border-white/10" />
        <div className="-mt-4 mb-2 flex justify-center">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-rambla-text-secondary">
            ACTIVIDAD RECIENTE
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-glow-card-bg p-4 backdrop-blur-lg">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-5 w-full animate-pulse rounded bg-white/10" />
            ))}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-400">Error: {error.message || String(error)}</div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="text-sm text-rambla-text-secondary">No hay actividad reciente.</div>
        )}
        {!isLoading && !error && items.length > 0 && (
          <ul className="divide-y divide-white/10">
            {items.map((evt) => {
              const conf = typeMeta[evt.action_type] || {};
              const Icon = conf.icon || DocumentArrowUpIcon;
              const actor = evt.author?.full_name || 'Alguien';
              const client = <Link className="text-rambla-accent hover:underline" to={`/clients/${evt.client_id}`}>{evt.client_name || 'Cliente'}</Link>;
              const details = typeof evt.details === 'object' ? evt.details : (evt.details ? (()=>{ try {return JSON.parse(evt.details)} catch {return {}} })() : {});
              const text = conf.text ? conf.text(actor, 'CLIENTE', details) : `${actor} realizó una acción`;
              return (
                <li key={evt.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5">
                    <Icon className="h-4 w-4 text-white/80" />
                  </div>
                  <div className="flex-1 text-sm text-white/90">
                    {conf.text ? (
                      <>
                        <span>{conf.text(actor, 'Cliente', details)} </span>
                        <Link className="text-rambla-accent hover:underline" to={`/clients/${evt.client_id}`}>ver cliente</Link>
                      </>
                    ) : (
                      <span>{text}</span>
                    )}
                    <div className="text-xs text-white/50">{timeAgo(evt.created_at)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-rambla-accent disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
