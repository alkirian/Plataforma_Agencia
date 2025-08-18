import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getDocumentsForClient,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} from '../api/documents';

const QUERY_KEY = clientId => ['documents', clientId];

export const useDocuments = clientId => {
  const queryClient = useQueryClient();

  // Fetch documents list
  const documentsQuery = useQuery({
    queryKey: QUERY_KEY(clientId),
    queryFn: async () => {
      const res = await getDocumentsForClient(clientId);
      // apiFetch shape: { success, data, message }
      if (res?.success === false) throw new Error(res.message || 'Error al cargar documentos');
      return res?.data || [];
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });

  // Upload
  const uploadMut = useMutation({
    mutationFn: ({ file, folder_id }) => uploadDocument(clientId, file, folder_id),
    onMutate: async ({ file, folder_id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) });
      const prev = queryClient.getQueryData(QUERY_KEY(clientId));
      const optimistic = {
        id: `temp-${Date.now()}`,
        file_name: file?.name || 'archivo',
        file_type: file?.type,
        file_size: file?.size,
        folder_id: folder_id || null,
        created_at: new Date().toISOString(),
        ai_status: 'processing',
        _optimistic: true,
      };
      queryClient.setQueryData(QUERY_KEY(clientId), (old = []) => [...old, optimistic]);
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev);
      toast.error(err?.message || 'Error al subir documento');
    },
    onSuccess: () => {
      toast.success('Documento subido');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(clientId) });
    },
  });

  // Delete
  const deleteMut = useMutation({
    mutationFn: documentId => deleteDocument(clientId, documentId),
    onMutate: async documentId => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(clientId) });
      const prev = queryClient.getQueryData(QUERY_KEY(clientId));
      queryClient.setQueryData(QUERY_KEY(clientId), (old = []) =>
        old.filter(d => d.id !== documentId)
      );
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY(clientId), ctx.prev);
      toast.error(err?.message || 'Error al eliminar');
    },
    onSuccess: () => {
      toast.success('Documento eliminado');
    },
  });

  // Download
  const downloadMut = useMutation({
    mutationFn: doc => downloadDocument(doc),
    onError: err => toast.error(err?.message || 'Error al descargar'),
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    refetch: documentsQuery.refetch,

    upload: uploadMut.mutateAsync,
    isUploading: uploadMut.isPending,

    remove: deleteMut.mutateAsync,
    isDeleting: deleteMut.isPending,

    download: downloadMut.mutateAsync,
    isDownloading: downloadMut.isPending,
  };
};
