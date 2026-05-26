import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { getClientScheduleAssetsWithPreview, deleteScheduleItemAsset } from '../../api/schedule';
import { toast } from 'react-hot-toast';

export const DeliverableGallery = ({ clientId }) => {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'image' | 'video' | 'other'
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Cargar assets
  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const data = await getClientScheduleAssetsWithPreview(clientId);
      setAssets(data || []);
    } catch (error) {
      console.error('Error al cargar entregables:', error);
      toast.error('Error al cargar la galería de entregables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadAssets();
    }
  }, [clientId]);

  // Borrar asset
  const handleDeleteAsset = async (assetId, fileName) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar el entregable "${fileName}"? Se quitará de la publicación del calendario.`
      )
    ) {
      return;
    }

    try {
      await deleteScheduleItemAsset(clientId, assetId);
      toast.success('Entregable eliminado');
      // Recargar localmente sin peticiones pesadas o llamando de nuevo
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err) {
      console.error('Error al eliminar entregable:', err);
      toast.error('No se pudo eliminar el entregable');
    }
  };

  // Descargar archivo
  const handleDownload = async (previewUrl, fileName) => {
    if (!previewUrl) {
      toast.error('La URL de descarga no es válida o expiró.');
      return;
    }
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Descarga iniciada');
    } catch (err) {
      console.error('Error al descargar archivo:', err);
      // Fallback: abrir en nueva pestaña
      window.open(previewUrl, '_blank');
    }
  };

  // Obtener canales disponibles de los assets cargados para el filtro
  const channels = useMemo(() => {
    const list = new Set();
    assets.forEach(asset => {
      const ch = asset.schedule_items?.channel;
      if (ch) list.add(ch);
    });
    return Array.from(list);
  }, [assets]);

  // Filtrado de assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const postTitle = asset.schedule_items?.title || '';
      const fileName = asset.file_name || '';
      const matchesSearch =
        postTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fileName.toLowerCase().includes(searchQuery.toLowerCase());

      const mime = asset.mime_type || '';
      let matchesType = true;
      if (filterType === 'image') matchesType = mime.startsWith('image/');
      else if (filterType === 'video') matchesType = mime.startsWith('video/');
      else if (filterType === 'other')
        matchesType = !mime.startsWith('image/') && !mime.startsWith('video/');

      const channel = asset.schedule_items?.channel || 'none';
      const matchesChannel = filterChannel === 'all' || channel === filterChannel;

      const status = asset.schedule_items?.status || 'Pendiente';
      const matchesStatus = filterStatus === 'all' || status === filterStatus;

      return matchesSearch && matchesType && matchesChannel && matchesStatus;
    });
  }, [assets, searchQuery, filterType, filterChannel, filterStatus]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    let total = assets.length;
    let images = assets.filter(a => a.mime_type?.startsWith('image/')).length;
    let videos = assets.filter(a => a.mime_type?.startsWith('video/')).length;
    let approved = assets.filter(
      a => a.schedule_items?.status === 'Aprobado' || a.schedule_items?.status === 'Publicado'
    ).length;

    return { total, images, videos, approved };
  }, [assets]);

  // Colores para las etiquetas de los canales sociales
  const getChannelBadgeStyles = (channel = '') => {
    const ch = channel.toLowerCase();
    if (ch.includes('instagram'))
      return 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-semibold';
    if (ch.includes('tiktok')) return 'bg-black border border-cyan-400/50 text-white font-semibold';
    if (ch.includes('linkedin')) return 'bg-blue-600 text-white font-medium';
    if (ch.includes('facebook')) return 'bg-blue-800 text-white font-medium';
    if (ch.includes('youtube')) return 'bg-red-600 text-white font-medium';
    if (ch.includes('twitter') || ch.includes('x'))
      return 'bg-neutral-900 border border-white/20 text-white';
    return 'bg-surface-strong border border-white/10 text-text-muted';
  };

  // Colores para el estado
  const getStatusBadgeStyles = (status = '') => {
    const st = status.toLowerCase();
    if (st.includes('aprobado') || st.includes('publicado')) {
      return 'bg-green-500/20 text-green-300 border border-green-500/30';
    }
    if (st.includes('diseño') || st.includes('progreso')) {
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
    }
    if (st.includes('cancelado')) {
      return 'bg-red-500/20 text-red-300 border border-red-500/30';
    }
    return 'bg-white/5 text-text-muted border border-white/10';
  };

  const formatFileSize = bytes => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-6'>
      {/* Resumen de Estadísticas */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <div className='bg-surface-soft border border-white/10 rounded-xl p-4 flex flex-col justify-between'>
          <span className='text-xs text-text-muted font-medium uppercase tracking-wider'>
            Entregables Totales
          </span>
          <span className='text-2xl font-bold text-text-primary mt-2'>{stats.total}</span>
        </div>
        <div className='bg-surface-soft border border-white/10 rounded-xl p-4 flex flex-col justify-between'>
          <span className='text-xs text-text-muted font-medium uppercase tracking-wider'>
            Imágenes IA / Diseños
          </span>
          <span className='text-2xl font-bold text-primary-400 mt-2'>{stats.images}</span>
        </div>
        <div className='bg-surface-soft border border-white/10 rounded-xl p-4 flex flex-col justify-between'>
          <span className='text-xs text-text-muted font-medium uppercase tracking-wider'>
            Videos / Reels
          </span>
          <span className='text-2xl font-bold text-cyan-400 mt-2'>{stats.videos}</span>
        </div>
        <div className='bg-surface-soft border border-white/10 rounded-xl p-4 flex flex-col justify-between'>
          <span className='text-xs text-text-muted font-medium uppercase tracking-wider'>
            Listos / Aprobados
          </span>
          <span className='text-2xl font-bold text-green-400 mt-2'>{stats.approved}</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className='bg-surface-soft border border-white/10 rounded-xl p-4 space-y-4'>
        <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
          {/* Búsqueda */}
          <div className='relative w-full md:max-w-md'>
            <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted' />
            <input
              type='text'
              placeholder='Buscar entregables o posteos...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full bg-surface-strong border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:border-primary-500 focus:outline-none transition-colors'
            />
          </div>

          {/* Filtros rápidos */}
          <div className='flex flex-wrap gap-2 items-center w-full md:w-auto justify-start md:justify-end'>
            <div className='flex items-center space-x-1 bg-surface-strong border border-white/5 rounded-lg p-0.5'>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterType === 'all' ? 'bg-primary-500/20 text-primary-400' : 'text-text-muted hover:text-text-primary'}`}
              >
                Todo
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterType === 'image' ? 'bg-primary-500/20 text-primary-400' : 'text-text-muted hover:text-text-primary'}`}
              >
                Imágenes
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterType === 'video' ? 'bg-primary-500/20 text-primary-400' : 'text-text-muted hover:text-text-primary'}`}
              >
                Videos
              </button>
              <button
                onClick={() => setFilterType('other')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterType === 'other' ? 'bg-primary-500/20 text-primary-400' : 'text-text-muted hover:text-text-primary'}`}
              >
                Otros
              </button>
            </div>

            {/* Filtro Canal */}
            <select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
              className='bg-surface-strong border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary-500 transition-colors'
            >
              <option value='all'>📱 Todos los Canales</option>
              {channels.map(ch => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>

            {/* Filtro Estado */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className='bg-surface-strong border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary-500 transition-colors'
            >
              <option value='all'>🛡️ Todos los Estados</option>
              <option value='Pendiente'>Pendiente</option>
              <option value='En Diseño'>En Diseño</option>
              <option value='En Progreso'>En Progreso</option>
              <option value='Aprobado'>Aprobado</option>
              <option value='Publicado'>Publicado</option>
              <option value='Cancelado'>Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      {isLoading ? (
        <div className='py-24 text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'></div>
          <p className='text-text-muted text-sm'>
            Cargando entregables y archivos de publicación...
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className='bg-surface-soft border border-white/10 rounded-xl p-12 text-center'>
          <PhotoIcon className='h-16 w-16 text-text-muted/40 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-text-primary mb-2'>
            No se encontraron entregables
          </h3>
          <p className='text-sm text-text-muted max-w-md mx-auto'>
            {assets.length === 0
              ? 'Aquí aparecerán las imágenes y videos cargados en el calendario de contenidos, además de las imágenes generadas por IA.'
              : 'Prueba a cambiar los filtros de búsqueda arriba.'}
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        >
          <AnimatePresence mode='popLayout'>
            {filteredAssets.map((asset, index) => {
              const mime = asset.mime_type || '';
              const isImage = mime.startsWith('image/');
              const isVideo = mime.startsWith('video/');
              const post = asset.schedule_items || {};

              return (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className='group bg-surface-soft border border-white/10 rounded-xl overflow-hidden hover:border-white/20 hover:bg-surface-strong transition-all duration-300 flex flex-col justify-between shadow-lg'
                >
                  {/* Preview Visual */}
                  <div className='relative aspect-video bg-surface-strong border-b border-white/5 overflow-hidden flex items-center justify-center'>
                    {isImage && asset.preview_url ? (
                      <img
                        src={asset.preview_url}
                        alt={asset.file_name}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                        loading='lazy'
                      />
                    ) : isVideo && asset.preview_url ? (
                      <div className='relative w-full h-full'>
                        <video
                          src={asset.preview_url}
                          className='w-full h-full object-cover'
                          muted
                          loop
                          playsInline
                          onMouseEnter={e => e.target.play().catch(() => {})}
                          onMouseLeave={e => e.target.pause()}
                        />
                        <div className='absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] text-white flex items-center space-x-1'>
                          <VideoCameraIcon className='h-3 w-3' />
                          <span>Video Preview</span>
                        </div>
                      </div>
                    ) : (
                      <div className='text-center p-6'>
                        <DocumentIcon className='h-12 w-12 text-text-muted mx-auto mb-2 opacity-50' />
                        <span className='text-xs text-text-muted truncate max-w-full block px-4'>
                          {asset.file_name}
                        </span>
                      </div>
                    )}

                    {/* Badge Canal Social */}
                    {post.channel && (
                      <span
                        className={`absolute top-2 left-2 text-[10px] uppercase tracking-wider rounded px-2 py-0.5 shadow-md ${getChannelBadgeStyles(post.channel)}`}
                      >
                        {post.channel}
                      </span>
                    )}

                    {/* Badge de Estado de Publicación */}
                    {post.status && (
                      <span
                        className={`absolute top-2 right-2 text-[10px] rounded-full px-2 py-0.5 shadow-md ${getStatusBadgeStyles(post.status)}`}
                      >
                        {post.status}
                      </span>
                    )}
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className='p-4 flex-1 flex flex-col justify-between'>
                    <div>
                      {/* Título de la publicación */}
                      <div className='mb-2'>
                        <span className='text-[10px] uppercase font-bold tracking-widest text-primary-400'>
                          Publicación
                        </span>
                        <h4
                          className='text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-primary-300 transition-colors'
                          title={post.title || 'Sin título'}
                        >
                          {post.title || 'Sin título'}
                        </h4>
                      </div>

                      {/* Archivo info */}
                      <p className='text-xs text-text-muted truncate mb-1' title={asset.file_name}>
                        📄 {asset.file_name}
                      </p>

                      <div className='flex items-center space-x-2 text-[10px] text-text-muted mt-2'>
                        {asset.size_bytes && <span>{formatFileSize(asset.size_bytes)}</span>}
                        <span>•</span>
                        {post.scheduled_at ? (
                          <div className='flex items-center space-x-1'>
                            <CalendarIcon className='h-3 w-3 text-text-muted' />
                            <span>Prog: {new Date(post.scheduled_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          asset.created_at && <span>Subido: {formatDate(asset.created_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className='flex items-center justify-between border-t border-white/5 pt-3 mt-4'>
                      <span className='text-[10px] text-text-muted truncate max-w-[120px]'>
                        {mime.split('/')[1]?.toUpperCase() || 'ARCHIVO'}
                      </span>

                      <div className='flex items-center space-x-1'>
                        <button
                          onClick={() => handleDownload(asset.preview_url, asset.file_name)}
                          className='p-2 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-primary-400'
                          title='Descargar entregable'
                        >
                          <ArrowDownTrayIcon className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id, asset.file_name)}
                          className='p-2 rounded-lg hover:bg-red-500/20 transition-colors text-text-muted hover:text-red-400'
                          title='Eliminar entregable'
                        >
                          <TrashIcon className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
