import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listWebSources, startWebScrape } from '../../api/webSources';

export const WebSourceManager = ({ clientId }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['web-sources', clientId],
    queryFn: () => listWebSources(clientId).then(r => r.data),
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: ({ url }) => startWebScrape(clientId, url),
    onSuccess: () => {
      reset();
      qc.invalidateQueries({ queryKey: ['web-sources', clientId] });
    },
  });

  const onSubmit = (values) => {
    mutation.mutate({ url: values.url });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <input
          type="url"
          placeholder="https://example.com"
          className="input flex-1"
          {...register('url', { required: true, pattern: /^(https?:\/\/).+/i })}
        />
        <button type="submit" className="btn-primary">Añadir y Escanear</button>
      </form>
      {errors.url && <p className="text-sm text-red-500">Introduce una URL válida.</p>}

      {isLoading && <p className="text-text-muted">Cargando fuentes…</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      <ul className="divide-y divide-[color:var(--color-border-subtle)] rounded-md border border-[color:var(--color-border-subtle)]">
        {(data || []).map(src => (
          <li key={src.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-text-primary">{src.url_root}</div>
              <div className="text-sm text-text-muted">{src.seed_url}</div>
            </div>
            <div>
              {src.status === 'pending' && <span className="badge bg-yellow-500/10 text-yellow-500">Pendiente</span>}
              {src.status === 'scraping' && <span className="badge bg-blue-500/10 text-blue-500">Escaneando… ({src.pages_crawled ?? 0})</span>}
              {src.status === 'completed' && <span className="badge bg-green-500/10 text-green-500">Completado</span>}
              {src.status === 'failed' && <span className="badge bg-red-500/10 text-red-500" title={src.error_message || ''}>Falló</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
