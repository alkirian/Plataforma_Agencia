// useDocumentsV2.js - Modern Documents V2 Hook
// Enhanced with pagination, versioning, and improved upload handling

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../api/apiFetch.js';
import { supabase } from '../supabaseClient.js';

// API endpoints for Documents V2
const DOCUMENTS_V2_BASE = '/documents-v2';

// Query keys
const QUERY_KEYS = {
  documents: (clientId, params) => ['documents-v2', clientId, params],
  stats: (clientId) => ['documents-v2-stats', clientId]
};

// Document V2 API functions
const documentsV2API = {
  // List/search documents with pagination
  listDocuments: async (clientId, params = {}) => {
    const searchParams = new URLSearchParams({
      clientId,
      ...params,
      page: params.page || 1,
      limit: params.limit || 20
    }).toString();
    
    const response = await apiFetch(`${DOCUMENTS_V2_BASE}?${searchParams}`);
    if (!response.success) throw new Error(response.message);
    return response;
  },

  // Upload multiple documents with progress tracking
  uploadDocuments: async (clientId, files, onProgress) => {
    // Get authentication token following the same pattern as apiFetch
    const { data: sessionData } = await supabase.auth.getSession();
    const liveToken = sessionData?.session?.access_token || null;
    const legacyToken = !liveToken ? localStorage.getItem('authToken') : null;
    const tokenToUse = liveToken || legacyToken;

    const formData = new FormData();
    formData.append('clientId', clientId);
    
    files.forEach((fileItem, index) => {
      formData.append(`files`, fileItem.file);
      formData.append(`fileIds`, fileItem.id);
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress?.(percentComplete, event.loaded / (event.timeStamp / 1000));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.message));
            }
          } catch (e) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
      xhr.open('POST', `${baseUrl}${DOCUMENTS_V2_BASE}/upload`);
      
      // Add Authorization header if token is available
      if (tokenToUse) {
        xhr.setRequestHeader('Authorization', `Bearer ${tokenToUse}`);
      }
      
      xhr.send(formData);
    });
  },

  // Pin/unpin document
  togglePin: async (documentId) => {
    const response = await apiFetch(`${DOCUMENTS_V2_BASE}/${documentId}/pin`, {
      method: 'PATCH'
    });
    if (!response.success) throw new Error(response.message);
    return response.data;
  },

  // Soft delete document
  deleteDocument: async (documentId) => {
    const response = await apiFetch(`${DOCUMENTS_V2_BASE}/${documentId}`, {
      method: 'DELETE'
    });
    if (!response.success) throw new Error(response.message);
    return response.data;
  },

  // Restore soft-deleted document
  restoreDocument: async (documentId) => {
    const response = await apiFetch(`${DOCUMENTS_V2_BASE}/${documentId}/restore`, {
      method: 'PATCH'
    });
    if (!response.success) throw new Error(response.message);
    return response.data;
  },

  // Rename document
  renameDocument: async (documentId, newName) => {
    const response = await apiFetch(`${DOCUMENTS_V2_BASE}/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ filename: newName })
    });
    if (!response.success) throw new Error(response.message);
    return response.data;
  },

  // Get storage stats
  getStats: async (clientId) => {
    const response = await apiFetch(`${DOCUMENTS_V2_BASE}/stats?clientId=${clientId}`);
    if (!response.success) throw new Error(response.message);
    return response.data;
  },

  // Get download URL
  getDownloadUrl: async (documentId) => {
    const response = await apiFetch(`${DOCUMENTS_V2_BASE}/${documentId}/download`);
    if (!response.success) throw new Error(response.message);
    return response.data.url;
  },

  // Get preview URL
  getPreviewUrl: async (documentId) => {
    const response = await apiFetch(`${DOCUMENTS_V2_BASE}/${documentId}/preview`);
    if (!response.success) throw new Error(response.message);
    return response.data.url;
  }
};

// Enhanced document model with utility methods
class DocumentV2 {
  constructor(data) {
    Object.assign(this, data);
  }

  isPinned() {
    return this.pinned === true;
  }

  isDeleted() {
    return this.deletedAt !== null;
  }

  isDuplicate() {
    return this.isDuplicate === true;
  }

  isImage() {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    return imageTypes.includes(this.mimeType);
  }

  isVideo() {
    return this.mimeType?.startsWith('video/');
  }

  isPdf() {
    return this.mimeType === 'application/pdf';
  }

  getExtension() {
    return this.filenameOriginal?.split('.').pop()?.toLowerCase();
  }

  getFileIcon() {
    if (this.isImage()) return 'photo';
    if (this.isVideo()) return 'video';
    if (this.isPdf()) return 'pdf';
    if (['zip', 'rar', '7z'].includes(this.getExtension())) return 'archive';
    return 'document';
  }
}

// Main hook
export const useDocumentsV2 = (clientId, options = {}) => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  // Default query parameters
  const defaultParams = {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeDeleted: false,
    ...options.defaultParams
  };

  const [queryParams, setQueryParams] = useState(defaultParams);

  // Documents query with pagination and search
  const documentsQuery = useQuery({
    queryKey: QUERY_KEYS.documents(clientId, queryParams),
    queryFn: () => {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required');
      }
      return documentsV2API.listDocuments(clientId, queryParams);
    },
    enabled: !!clientId && clientId !== 'undefined',
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => ({
      documents: Array.isArray(data.data) ? data.data.map(doc => new DocumentV2(doc)) : [],
      pagination: data.pagination || {}
    })
  });

  // Storage stats query
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.stats(clientId),
    queryFn: () => {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required');
      }
      return documentsV2API.getStats(clientId);
    },
    enabled: !!clientId && clientId !== 'undefined',
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Upload mutation with progress tracking
  const uploadMutation = useMutation({
    mutationFn: async ({ files }) => {
      if (!clientId || clientId === 'undefined') {
        throw new Error('Client ID is required for upload');
      }
      
      const uploadPromises = files.map(fileItem => {
        return documentsV2API.uploadDocuments(
          clientId,
          [fileItem],
          (progress, speed) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileItem.id]: { progress, speed, status: 'uploading' }
            }));
          }
        );
      });

      const results = await Promise.allSettled(uploadPromises);
      
      // Process results and update progress
      results.forEach((result, index) => {
        const fileItem = files[index];
        if (result.status === 'fulfilled') {
          setUploadProgress(prev => ({
            ...prev,
            [fileItem.id]: { progress: 100, status: 'done' }
          }));
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [fileItem.id]: { progress: 0, status: 'error', error: result.reason.message }
          }));
        }
      });

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      if (successCount > 0) {
        toast.success(`${successCount} document(s) uploaded successfully`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} document(s) failed to upload`);
      }
      
      // Refresh documents and stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents(clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats(clientId) });
    },
    onError: (error) => {
      toast.error(error.message || 'Upload failed');
    }
  });

  // Pin/unpin mutation
  const pinMutation = useMutation({
    mutationFn: documentsV2API.togglePin,
    onMutate: async (documentId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.documents(clientId) });
      
      const previousData = queryClient.getQueryData(QUERY_KEYS.documents(clientId, queryParams));
      
      queryClient.setQueryData(QUERY_KEYS.documents(clientId, queryParams), (old) => {
        if (!old) return old;
        return {
          ...old,
          documents: old.documents.map(doc => 
            doc.id === documentId 
              ? new DocumentV2({ ...doc, pinned: !doc.pinned })
              : doc
          )
        };
      });
      
      return { previousData };
    },
    onError: (error, documentId, context) => {
      queryClient.setQueryData(
        QUERY_KEYS.documents(clientId, queryParams),
        context.previousData
      );
      toast.error(error.message || 'Failed to update pin status');
    },
    onSuccess: () => {
      toast.success('Pin status updated');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: documentsV2API.deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents(clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats(clientId) });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete document');
    }
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: documentsV2API.restoreDocument,
    onSuccess: () => {
      toast.success('Document restored');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents(clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats(clientId) });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore document');
    }
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: ({ documentId, newName }) => 
      documentsV2API.renameDocument(documentId, newName),
    onSuccess: () => {
      toast.success('Document renamed');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents(clientId) });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to rename document');
    }
  });

  // Utility functions
  const updateQueryParams = useCallback((newParams) => {
    setQueryParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const search = useCallback((query) => {
    updateQueryParams({ search: query, page: 1 });
  }, [updateQueryParams]);

  const changePage = useCallback((page) => {
    updateQueryParams({ page });
  }, [updateQueryParams]);

  const changeSort = useCallback((sortBy, sortOrder) => {
    updateQueryParams({ sortBy, sortOrder, page: 1 });
  }, [updateQueryParams]);

  const clearUploadProgress = useCallback(() => {
    setUploadProgress({});
  }, []);

  const downloadDocument = useCallback(async (document) => {
    try {
      const downloadUrl = await documentsV2API.getDownloadUrl(document.id);
      
      // Create temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = document.filenameOriginal;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      toast.error(error.message || 'Download failed');
    }
  }, []);

  const previewDocument = useCallback(async (document) => {
    try {
      const previewUrl = await documentsV2API.getPreviewUrl(document.id);
      window.open(previewUrl, '_blank');
    } catch (error) {
      toast.error(error.message || 'Preview failed');
    }
  }, []);

  const selectDocument = useCallback((document, selected) => {
    setSelectedDocuments(prev => {
      if (selected) {
        return prev.includes(document.id) ? prev : [...prev, document.id];
      } else {
        return prev.filter(id => id !== document.id);
      }
    });
  }, []);

  const selectAllDocuments = useCallback((selected) => {
    if (selected) {
      const allIds = documentsQuery.data?.documents.map(doc => doc.id) || [];
      setSelectedDocuments(allIds);
    } else {
      setSelectedDocuments([]);
    }
  }, [documentsQuery.data]);

  return {
    // Data
    documents: documentsQuery.data?.documents || [],
    pagination: documentsQuery.data?.pagination || {},
    stats: statsQuery.data || {},
    selectedDocuments,
    uploadProgress,
    
    // Loading states
    isLoading: documentsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isUploading: uploadMutation.isPending,
    
    // Error states
    error: documentsQuery.error,
    statsError: statsQuery.error,
    
    // Actions
    upload: uploadMutation.mutateAsync,
    togglePin: pinMutation.mutateAsync,
    deleteDocument: deleteMutation.mutateAsync,
    restoreDocument: restoreMutation.mutateAsync,
    renameDocument: renameMutation.mutateAsync,
    downloadDocument,
    previewDocument,
    
    // Selection
    selectDocument,
    selectAllDocuments,
    clearSelection: () => setSelectedDocuments([]),
    
    // Navigation & search
    search,
    changePage,
    changeSort,
    updateQueryParams,
    queryParams,
    
    // Upload progress
    clearUploadProgress,
    
    // Refresh
    refetch: documentsQuery.refetch,
    refetchStats: statsQuery.refetch
  };
};

export default useDocumentsV2;