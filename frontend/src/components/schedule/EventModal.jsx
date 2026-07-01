import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowUpTrayIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import { useLanguage, useEscapeClose } from '../../hooks';
import { getCurrentDate } from '../../utils/dateHelpers';
import { toDateInputValue, normalizeFormat, normalizePlatform, inferFormatFromFiles } from './scheduleUtils';
import {
  uploadScheduleAsset,
  getScheduleItemAssetsWithPreview,
  generateImageForEvent,
  deleteScheduleItemAsset,
  publishScheduleItem,
} from '../../api/schedule';
import { generateIdeas } from '../../api/ai';

export const EventModal = ({
  isOpen,
  onClose,
  selectedEvent,
  clientId,
  isReadOnly,
  createEvent,
  updateEvent,
  deleteEvent,
  loadEvents,
  initialDate,
}) => {
  useEscapeClose(isOpen, onClose);
  const { lang, t } = useLanguage();
  // Estados locales del formulario
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '09:00',
    status: 'en-diseño',
    copy: '',
    channel: 'IG',
    creative_idea: '',
    goal: '',
    format: 'Carrusel',
    platforms: 'Instagram',
    description: '',
  });

  // Estados locales de archivos y control de IA
  const [eventAssets, setEventAssets] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isGeneratingEventAI, setIsGeneratingEventAI] = useState(false);
  const [isEventAIGenOpen, setIsEventAIGenOpen] = useState(false);
  const [eventAIPrompt, setEventAIPrompt] = useState('');
  const [eventAIAspectRatio, setEventAIAspectRatio] = useState('1:1');
  const [isGeneratingEventImage, setIsGeneratingEventImage] = useState(false);
  const [isModalDragOver, setIsModalDragOver] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Determinar si la fecha del evento es hoy
  const isEventDateToday = useMemo(() => {
    if (!formData.date) return false;
    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return formData.date === todayStr;
  }, [formData.date]);

  // Inicializar o limpiar estados cuando se abre/cierra o cambia el evento
  useEffect(() => {
    if (!isOpen) {
      // Revocar objectURLs de los archivos temporales para evitar fugas de memoria
      pendingFiles.forEach(fileObj => {
        if (fileObj.preview_url && fileObj.preview_url.startsWith('blob:')) {
          URL.revokeObjectURL(fileObj.preview_url);
        }
      });
      setPendingFiles([]);
      setEventAssets([]);
      setIsEventAIGenOpen(false);
      setEventAIPrompt('');
      setEventAIAspectRatio('1:1');
      setIsModalDragOver(false);
      return;
    }

    if (selectedEvent) {
      try {
        const d = selectedEvent.start ? new Date(selectedEvent.start) : new Date();
        const yyyy = String(d.getFullYear());
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');

        setFormData({
          title: selectedEvent.title || '',
          date: `${yyyy}-${mm}-${dd}`,
          time: `${hh}:${min}`,
          status: selectedEvent.extendedProps?.status || 'en-diseño',
          copy: selectedEvent.extendedProps?.copy || '',
          channel: selectedEvent.extendedProps?.channel || 'IG',
          creative_idea: selectedEvent.extendedProps?.creative_idea || '',
          goal: selectedEvent.extendedProps?.goal || '',
          format: selectedEvent.extendedProps?.format || 'Carrusel',
          platforms: selectedEvent.extendedProps?.platforms || 'Instagram',
          description: selectedEvent.extendedProps?.description || '',
        });
      } catch (_err) {
        setFormData(prev => ({
          title: selectedEvent.title || '',
          date: toDateInputValue(selectedEvent.start || new Date()),
          time: '09:00',
          status: selectedEvent.extendedProps?.status || 'en-diseño',
          copy: selectedEvent.extendedProps?.copy || '',
          channel: selectedEvent.extendedProps?.channel || 'IG',
          creative_idea: selectedEvent.extendedProps?.creative_idea || '',
          goal: selectedEvent.extendedProps?.goal || '',
          format: selectedEvent.extendedProps?.format || 'Carrusel',
          platforms: selectedEvent.extendedProps?.platforms || 'Instagram',
          description: selectedEvent.extendedProps?.description || '',
        }));
      }

      // Cargar archivos asociados desde el backend
      const loadAssets = async () => {
        try {
          setIsLoadingAssets(true);
          const assets = await getScheduleItemAssetsWithPreview(clientId, selectedEvent.id);
          setEventAssets(assets);
        } catch (_error) {
          setEventAssets([]);
        } finally {
          setIsLoadingAssets(false);
        }
      };
      loadAssets();
    } else {
      // Evento nuevo
      const defaultDate = initialDate ? toDateInputValue(initialDate) : toDateInputValue(getCurrentDate());
      setFormData({
        title: '',
        date: defaultDate,
        time: '09:00',
        status: 'en-diseño',
        copy: '',
        channel: 'IG',
        creative_idea: '',
        goal: '',
        format: 'Carrusel',
        platforms: 'Instagram',
        description: '',
      });
      setEventAssets([]);
    }
  }, [isOpen, selectedEvent, clientId, initialDate]);

  // Handlers para archivos multimedia
  const handleModalDragOver = useCallback(e => {
    e.preventDefault();
    setIsModalDragOver(true);
  }, []);

  const handleModalDragLeave = useCallback(e => {
    e.preventDefault();
    setIsModalDragOver(false);
  }, []);

  const handleModalFileUpload = useCallback(
    async filesList => {
      const files = Array.from(filesList);
      if (!files.length) return;

      const maxSizeBytes = 250 * 1024 * 1024;
      const oversized = files.find(file => file.size > maxSizeBytes);
      if (oversized) {
        toast.error(lang === 'es' ? `${oversized.name} supera los 250MB.` : `${oversized.name} exceeds 250MB.`);
        return;
      }

      if (selectedEvent?.id) {
        // Post existente: subir de inmediato
        const uploadToast = toast.loading(lang === 'es' ? 'Subiendo archivo multimedia...' : 'Uploading media file...');
        try {
          for (let i = 0; i < files.length; i++) {
            const newAsset = await uploadScheduleAsset(clientId, selectedEvent.id, files[i], {
              asset_role: 'carousel_slide',
              sort_order: eventAssets.length + i,
            });
            const localUrl = URL.createObjectURL(files[i]);
            newAsset.preview_url = localUrl;
            setEventAssets(prev => [...prev, newAsset]);
          }
          toast.success(lang === 'es' ? 'Archivo subido con éxito.' : 'File uploaded successfully.', { id: uploadToast });
          const updatedAssets = await getScheduleItemAssetsWithPreview(clientId, selectedEvent.id);
          setEventAssets(updatedAssets);
        } catch (err) {
          toast.error(err.message || (lang === 'es' ? 'Error al subir archivo.' : 'Error uploading file.'), { id: uploadToast });
        }
      } else {
        // Nuevo post: guardar en pendingFiles temporalmente
        const filesWithPreview = files.map((file, idx) => ({
          id: `temp-${Date.now()}-${idx}-${Math.random()}`,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          file: file,
          preview_url: URL.createObjectURL(file),
        }));
        setPendingFiles(prev => [...prev, ...filesWithPreview]);
        toast.success(
          lang === 'es'
            ? `${files.length} archivo(s) agregado(s).`
            : `${files.length} file(s) added.`
        );
      }
    },
    [clientId, selectedEvent, eventAssets, lang]
  );

  const handleModalDrop = useCallback(
    e => {
      e.preventDefault();
      setIsModalDragOver(false);
      if (e.dataTransfer?.files?.length) {
        handleModalFileUpload(e.dataTransfer.files);
      }
    },
    [handleModalFileUpload]
  );

  const handleRemoveModalAsset = useCallback(
    async assetToRemove => {
      if (assetToRemove.id.startsWith('temp-')) {
        setPendingFiles(prev => prev.filter(a => a.id !== assetToRemove.id));
        if (assetToRemove.preview_url && assetToRemove.preview_url.startsWith('blob:')) {
          URL.revokeObjectURL(assetToRemove.preview_url);
        }
        toast.success(lang === 'es' ? 'Archivo removido.' : 'File removed.');
      } else {
        if (window.confirm(lang === 'es' ? '¿Estás seguro de que deseas eliminar este archivo de forma permanente?' : 'Are you sure you want to permanently delete this file?')) {
          const deleteToast = toast.loading(lang === 'es' ? 'Eliminando archivo...' : 'Deleting file...');
          try {
            await deleteScheduleItemAsset(clientId, assetToRemove.id);
            setEventAssets(prev => prev.filter(a => a.id !== assetToRemove.id));
            toast.success(lang === 'es' ? 'Archivo eliminado.' : 'File deleted.', { id: deleteToast });
          } catch (err) {
            toast.error(err.message || (lang === 'es' ? 'Error al eliminar archivo.' : 'Error deleting file.'), { id: deleteToast });
          }
        }
      }
    },
    [clientId, lang]
  );

  // Handler para guardar / actualizar
  const handleFormSubmit = useCallback(
    async e => {
      e.preventDefault();
      try {
        if (!formData.title || !formData.date) {
          toast.error(lang === 'es' ? 'Completa título y fecha' : 'Complete title and date');
          return;
        }

        const timeVal = formData.time || '09:00';
        const scheduled_at = new Date(`${formData.date}T${timeVal}:00`);
        const eventData = {
          title: formData.title,
          status: formData.status,
          scheduled_at: scheduled_at.toISOString(),
          copy: formData.copy || '',
          channel: formData.channel || 'IG',
          creative_idea: formData.creative_idea || '',
          goal: formData.goal || '',
          format: formData.format || 'Carrusel',
          platforms: formData.platforms || 'Instagram',
          description: formData.description || '',
        };

        if (selectedEvent?.id) {
          await updateEvent(selectedEvent.id, eventData);
          toast.success(lang === 'es' ? 'Evento actualizado' : 'Event updated');
        } else {
          const created = await createEvent(eventData);
          if (pendingFiles.length > 0) {
            const uploadToast = toast.loading(lang === 'es' ? 'Subiendo archivos al nuevo post...' : 'Uploading files to new post...');
            try {
              for (let i = 0; i < pendingFiles.length; i++) {
                await uploadScheduleAsset(clientId, created.id, pendingFiles[i].file, {
                  asset_role: pendingFiles.length > 1 ? 'carousel_slide' : 'final',
                  sort_order: i,
                });
              }
              toast.success(lang === 'es' ? '¡Archivos asociados al nuevo post con éxito!' : 'Files associated with the new post successfully!', { id: uploadToast });
            } catch (_uploadErr) {
              toast.error(lang === 'es' ? 'Post creado, pero no se pudieron cargar todos los archivos.' : 'Post created, but not all files could be uploaded.', {
                id: uploadToast,
              });
            }
          }
        }
        onClose();
      } catch (_err) {
        // Los hooks correspondientes ya manejan alertas de error
      }
    },
    [formData, selectedEvent, createEvent, updateEvent, pendingFiles, clientId, onClose]
  );

  // Handler para publicar ahora
  const handlePublishEvent = useCallback(
    async itemId => {
      if (!itemId) return;
      setIsPublishing(true);
      const publishToast = toast.loading(lang === 'es' ? 'Publicando en redes sociales...' : 'Publishing on social media...');
      try {
        // Guardar cambios locales primero antes de publicar
        const timeVal = formData.time || '09:00';
        const scheduled_at = new Date(`${formData.date}T${timeVal}:00`);
        const eventData = {
          title: formData.title,
          status: formData.status,
          scheduled_at: scheduled_at.toISOString(),
          copy: formData.copy || '',
          channel: formData.channel || 'IG',
          creative_idea: formData.creative_idea || '',
          goal: formData.goal || '',
          format: formData.format || 'Carrusel',
          platforms: formData.platforms || 'Instagram',
          description: formData.description || '',
        };
        await updateEvent(itemId, eventData);

        const res = await publishScheduleItem(clientId, itemId);
        if (res?.success) {
          toast.success(res.message || (lang === 'es' ? '¡Publicado con éxito en las redes sociales!' : 'Published successfully on social media!'), { id: publishToast });
          await loadEvents();
          onClose();
        } else {
          throw new Error(res?.message || (lang === 'es' ? 'Error al publicar.' : 'Error publishing.'));
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || (lang === 'es' ? 'Error al publicar en redes sociales.' : 'Error publishing on social media.'), { id: publishToast, duration: 6000 });
      } finally {
        setIsPublishing(false);
      }
    },
    [clientId, loadEvents, formData, updateEvent, onClose, lang]
  );

  // Handler para eliminar evento
  const handleDeleteEvent = useCallback(async () => {
    if (selectedEvent && window.confirm(lang === 'es' ? '¿Estás seguro de que quieres eliminar este evento?' : 'Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(selectedEvent.id);
        onClose();
      } catch (_err) {
        // El hook correspondiente maneja el error
      }
    }
  }, [selectedEvent, deleteEvent, onClose, lang]);

  // Generar idea contextual para esta fecha
  const handleGenerateEventIdea = useCallback(async () => {
    if (!formData.date) {
      toast.error(lang === 'es' ? 'Elegi una fecha antes de generar con IA.' : 'Choose a date before generating with AI.');
      return;
    }

    const selectedDay = new Date(`${formData.date}T12:00:00`);
    const dateLabel = Number.isNaN(selectedDay.getTime())
      ? formData.date
      : selectedDay.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    setIsGeneratingEventAI(true);
    try {
      const response = await generateIdeas(clientId, {
        userPrompt: [
          lang === 'es' ? `Genera una unica idea de posteo para la fecha exacta ${dateLabel}.` : `Generate a single post idea for the exact date ${dateLabel}.`,
          formData.title?.trim()
            ? (lang === 'es' ? `Tema inicial o titulo del usuario: ${formData.title.trim()}.` : `Initial topic or user title: ${formData.title.trim()}.`)
            : '',
          formData.copy?.trim() ? (lang === 'es' ? `Copy o borrador actual: ${formData.copy.trim()}.` : `Current copy or draft: ${formData.copy.trim()}.`) : '',
          lang === 'es' ? `Canal preferido: ${formData.channel || 'IG'}.` : `Preferred channel: ${formData.channel || 'IG'}.`,
          lang === 'es'
            ? 'La idea debe incluir titulo, copy completo, formato sugerido, objetivo y CTA.'
            : 'The idea must include a title, complete copy, suggested format, goal, and CTA.',
        ]
          .filter(Boolean)
          .join(' '),
        monthContext: [
          `Target date: ${formData.date}`,
          `Channel: ${formData.channel || 'IG'}`,
          'Generation from specific event creation modal.',
        ],
        quantity: 1,
        targetDate: formData.date,
      });

      const idea = Array.isArray(response) ? response[0] : response?.ideas?.[0];
      if (!idea) {
        toast.error(lang === 'es' ? 'La IA no devolvio una idea para esta fecha.' : 'The AI did not return an idea for this date.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        title: idea.title || prev.title,
        copy: idea.copy || prev.copy || '',
        creative_idea: idea.title || prev.creative_idea || '',
        goal: idea.objective || idea.goal || prev.goal || '',
        format: normalizeFormat(idea.format) || prev.format || 'Carrusel',
        platforms: normalizePlatform(idea.channel) || prev.platforms || 'Instagram',
        channel: idea.channel || prev.channel || 'IG',
        status: idea.status || prev.status || 'en-diseño',
        date: formData.date,
      }));
      toast.success(lang === 'es' ? 'Idea generada para esta fecha.' : 'Idea generated for this date.');
    } catch (error) {
      toast.error(error.message || (lang === 'es' ? 'No se pudo generar contenido con IA.' : 'Could not generate content with AI.'));
    } finally {
      setIsGeneratingEventAI(false);
    }
  }, [clientId, formData, lang]);

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
          <div className='fixed inset-0 bg-black/70' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-200'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-150'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-6xl bg-[#161517] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md transition-all duration-300'>
                {/* Header */}
                <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5 w-full'>
                  <div className='flex items-center gap-3 flex-1 min-w-0 mr-4'>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${selectedEvent ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <input
                      type='text'
                      value={formData.title}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, title: e.target.value }))
                      }
                      className='bg-transparent border-none p-0 text-xl md:text-2xl font-bold text-white placeholder-white/20 focus:outline-none focus:ring-0 transition-all font-semibold w-full'
                      placeholder={lang === 'es' ? 'Título de la publicación...' : 'Publication title...'}
                      required
                      disabled={isReadOnly}
                    />
                    <select
                      value={formData.status}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, status: e.target.value }))
                      }
                      className='rounded-xl border border-white/10 bg-[#1e1c20] hover:bg-[#252327] px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none transition-all disabled:opacity-75 font-semibold cursor-pointer shrink-0 ml-2'
                      disabled={isReadOnly}
                    >
                      <option value='en-diseño' className='bg-[#161517] text-white'>
                        {lang === 'es' ? 'En Diseño' : 'In Design'}
                      </option>
                      <option value='en-progreso' className='bg-[#161517] text-white'>
                        {lang === 'es' ? 'En Producción' : 'In Production'}
                      </option>
                      <option value='aprobado' className='bg-[#161517] text-white'>
                        {lang === 'es' ? 'Aprobado' : 'Approved'}
                      </option>
                      <option value='Publicado' className='bg-[#161517] text-white'>
                        {lang === 'es' ? 'Publicado' : 'Published'}
                      </option>
                    </select>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    {!isReadOnly && (
                      <motion.button
                        type='button'
                        onClick={handleGenerateEventIdea}
                        disabled={isGeneratingEventAI || !formData.date}
                        whileHover={!isGeneratingEventAI ? { scale: 1.02 } : {}}
                        whileTap={!isGeneratingEventAI ? { scale: 0.98 } : {}}
                        className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 shadow-sm'
                      >
                        {isGeneratingEventAI ? (
                          <>
                            <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                            <span>{lang === 'es' ? 'Generando...' : 'Generating...'}</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className='h-4 w-4 text-emerald-400'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9.75 3.75 11 7l3.25 1.25L11 9.5l-1.25 3.25L8.5 9.5 5.25 8.25 8.5 7l1.25-3.25ZM17 12l.8 2.2L20 15l-2.2.8L17 18l-.8-2.2L14 15l2.2-.8L17 12Z'
                              />
                            </svg>
                            <span>{lang === 'es' ? 'Generar Idea con IA' : 'Generate Idea with AI'}</span>
                          </>
                        )}
                      </motion.button>
                    )}

                    <button
                      type='button'
                      onClick={onClose}
                      className='p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all'
                      aria-label='Cerrar modal'
                    >
                      <svg
                        className='w-6 h-6'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit}>
                  {/* Alerta de Ajustes Solicitados */}
                  {selectedEvent?.extendedProps?.client_feedback && (
                    <div className='rounded-xl bg-[#fe0979]/10 border border-[#fe0979]/20 p-4 space-y-1 mb-5'>
                      <div className='flex items-center gap-2 text-xs font-bold text-[#fe0979] uppercase tracking-wider'>
                        <svg
                          className='h-4 w-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                          />
                        </svg>
                        {lang === 'es' ? 'Ajustes Solicitados por el Cliente' : 'Adjustments Requested by the Client'}
                      </div>
                      <p className='text-xs text-gray-300 italic leading-relaxed pl-6'>
                        "{selectedEvent.extendedProps.client_feedback}"
                      </p>
                    </div>
                  )}

                  {/* Formulario */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar mb-6'>
                    {/* Columna Izquierda */}
                    <div className='space-y-4'>
                      {/* Copy de la Publicación */}
                      <div className='space-y-1.5'>
                        <label className='block text-[10px] font-bold text-gray-400 uppercase tracking-wider'>
                          {t.schedule.copyLabel || (lang === 'es' ? 'Copy de la Publicación' : 'Publication Copy')}
                        </label>
                        <div className='relative rounded-xl border border-white/10 bg-[#1e1c20]/15 focus-within:border-emerald-500/40 focus-within:bg-[#1e1c20]/30 transition-all p-2.5'>
                          <textarea
                            rows={11}
                            maxLength={2000}
                            value={formData.copy}
                            onChange={e => setFormData(prev => ({ ...prev, copy: e.target.value }))}
                            className='w-full bg-transparent px-1.5 py-0.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all resize-none min-h-[220px] pr-2 custom-scrollbar font-sans leading-relaxed border-none focus:ring-0'
                            placeholder={t.schedule.copyPlaceholder || (lang === 'es' ? 'Escribe el copy con emojis y hashtags aquí...' : 'Write your copy with emojis and hashtags here...')}
                            disabled={isReadOnly}
                          />
                          <div className='absolute bottom-1 right-2 text-[8px] text-gray-500 font-mono'>
                            {(formData.copy || '').length}/2000
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha */}
                    <div className='space-y-4'>
                      {/* Instrucciones Visuales */}
                      <div className='space-y-1.5'>
                        <label className='block text-[10px] font-bold text-gray-400 uppercase tracking-wider'>
                          {lang === 'es' ? 'Instrucciones Visuales / Titulares de Placa' : 'Visual Instructions / Graphic Headings'}
                        </label>
                        <div className='relative rounded-xl border border-white/10 bg-[#1e1c20]/15 focus-within:border-emerald-500/40 focus-within:bg-[#1e1c20]/30 transition-all p-2.5'>
                          <textarea
                            rows={4}
                            value={formData.description || ''}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className='w-full bg-transparent px-1.5 py-0.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all resize-none min-h-[90px] pr-2 custom-scrollbar font-sans leading-relaxed border-none focus:ring-0'
                            placeholder={lang === 'es' ? 'Instrucciones para el diseñador o texto a incluir en la placa (ej: "Colocar foto del producto en el centro y título grande: ¡50% OFF!")' : 'Instructions for the designer or text to include in the graphic (e.g.: "Place product photo in the center and large title: 50% OFF!")'}
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>

                      {/* Foto / Video / Contenido Visual */}
                      <div className='space-y-1.5'>
                        <label className='block text-[10px] font-bold text-gray-400 uppercase tracking-wider'>
                          {lang === 'es' ? 'Foto / Video / Contenido Visual' : 'Photo / Video / Visual Content'}
                        </label>
                        <div
                          onDragOver={isReadOnly ? undefined : handleModalDragOver}
                          onDragLeave={isReadOnly ? undefined : handleModalDragLeave}
                          onDrop={isReadOnly ? undefined : handleModalDrop}
                          className={`relative rounded-xl border border-dashed transition-all duration-300 overflow-hidden ${isReadOnly ? 'pointer-events-none' : ''} ${
                            isModalDragOver
                              ? 'border-rose-500 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
                              : 'border-white/10 bg-[#1e1c20]/20 hover:border-white/25 hover:bg-[#1e1c20]/40'
                          }`}
                        >
                          <input
                            type='file'
                            id='modal-media-input'
                            className='hidden'
                            multiple
                            accept='image/*,video/*'
                            onChange={e => handleModalFileUpload(e.target.files)}
                          />

                          {/* Generador IA Inline */}
                          {isEventAIGenOpen ? (
                            <div className='p-4 space-y-4 bg-gradient-to-b from-[#251d1e] to-[#1e1718] border-b border-rose-500/20'>
                              <div className='flex items-center justify-between'>
                                <span className='text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider'>
                                  <SparklesIcon className='w-4 h-4 animate-pulse text-rose-400' />
                                  <span>{lang === 'es' ? 'Generar Imagen con IA' : 'Generate Image with AI'}</span>
                                </span>
                                <button
                                  type='button'
                                  onClick={() => setIsEventAIGenOpen(false)}
                                  className='text-xs text-gray-400 hover:text-white transition-colors font-semibold'
                                >
                                  {t.common.cancel}
                                </button>
                              </div>

                              <div className='space-y-3'>
                                <div>
                                  <textarea
                                    rows={2}
                                    value={eventAIPrompt}
                                    onChange={e => setEventAIPrompt(e.target.value)}
                                    className='w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-rose-400 focus:outline-none transition-all resize-none leading-relaxed'
                                    placeholder={lang === 'es' ? "Describe la imagen que quieres generar en detalle (e.g. 'Infografía moderna en tonos pastel sobre cómo cuidar la salud'...)" : "Describe the image you want to generate in detail (e.g. 'Modern infographic in pastel tones about caring for health'...)"}
                                  />
                                </div>

                                <div className='flex items-center justify-between gap-4'>
                                  <div className='flex-1'>
                                    <div className='grid grid-cols-3 gap-1.5'>
                                      {[
                                        { id: '1:1', label: '1:1' },
                                        { id: '16:9', label: '16:9' },
                                        { id: '9:16', label: '9:16' },
                                      ].map(ratio => (
                                        <button
                                          key={ratio.id}
                                          type='button'
                                          onClick={() => setEventAIAspectRatio(ratio.id)}
                                          className={`rounded-md border py-0.5 px-1 text-center transition-all ${
                                            eventAIAspectRatio === ratio.id
                                              ? 'border-rose-400 bg-rose-400/10 text-rose-300 font-semibold'
                                              : 'border-white/5 bg-black/20 text-gray-400 hover:bg-black/30'
                                          }`}
                                        >
                                          <div className='text-[9px] font-bold leading-none'>
                                            {ratio.label}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <button
                                    type='button'
                                    disabled={isGeneratingEventImage || !eventAIPrompt.trim()}
                                    onClick={async () => {
                                      setIsGeneratingEventImage(true);
                                      try {
                                        let targetId = selectedEvent?.id;
                                        if (!targetId) {
                                          if (!formData.title) {
                                            toast.error(lang === 'es' ? 'Por favor escribe un título antes de generar con IA.' : 'Please write a title before generating with AI.');
                                            setIsGeneratingEventImage(false);
                                            return;
                                          }
                                          const scheduled_at = new Date(
                                            `${formData.date || toDateInputValue(getCurrentDate())}T${formData.time || '09:00'}:00`
                                          );
                                          const created = await createEvent({
                                            title: formData.title,
                                            status: formData.status,
                                            scheduled_at: scheduled_at.toISOString(),
                                            copy: formData.copy || '',
                                            channel: formData.channel || 'IG',
                                            platforms: formData.platforms || 'Instagram',
                                          });
                                          targetId = created.id;
                                          // eslint-disable-next-line react-hooks/exhaustive-deps
                                          selectedEvent = {
                                            id: created.id,
                                            title: created.title,
                                            start: new Date(created.scheduled_at),
                                            extendedProps: {
                                              status: created.status,
                                              channel: created.channel,
                                              copy: created.copy || '',
                                            },
                                          };
                                        }

                                        const newAsset = await generateImageForEvent(clientId, targetId, {
                                          prompt: eventAIPrompt,
                                          aspectRatio: eventAIAspectRatio,
                                        });
                                        setEventAssets(prev => [...prev, newAsset]);
                                        toast.success(lang === 'es' ? '¡Imagen generada e incorporada!' : 'Image generated and added!');
                                        setIsEventAIGenOpen(false);
                                      } catch (err) {
                                        console.error(err);
                                        toast.error(err.message || (lang === 'es' ? 'Error al generar imagen' : 'Error generating image'));
                                      } finally {
                                        setIsGeneratingEventImage(false);
                                      }
                                    }}
                                    className='flex items-center justify-center gap-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-slate-950 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md h-fit'
                                  >
                                    {isGeneratingEventImage ? (
                                      <>
                                        <span className='h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent' />
                                        <span>{lang === 'es' ? 'Generando...' : 'Generating...'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <SparklesIcon className='h-3.5 w-3.5' />
                                        <span>Generar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {/* Carrusel Multimedia Horizontal */}
                          {eventAssets.length > 0 || pendingFiles.length > 0 ? (
                            <div className='p-3 bg-black/10'>
                              <div className='text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between'>
                                <span>Archivos Multimedia ({eventAssets.length + pendingFiles.length})</span>
                                <span className='text-[8px] text-gray-500 lowercase font-normal'>Arrastra más archivos aquí</span>
                              </div>
                              <div className='flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar'>
                                {eventAssets.map(asset => {
                                  const mime = asset.mime_type || '';
                                  const isImage = mime.startsWith('image/');
                                  const isVideo = mime.startsWith('video/');
                                  return (
                                    <div
                                      key={asset.id}
                                      className='relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex-shrink-0 group'
                                    >
                                      {isImage && asset.preview_url ? (
                                        <img
                                          src={asset.preview_url}
                                          alt={asset.file_name}
                                          className='w-full h-full object-cover group-hover:scale-105 transition-all duration-300'
                                        />
                                      ) : isVideo && asset.preview_url ? (
                                        <video
                                          src={asset.preview_url}
                                          className='w-full h-full object-cover'
                                          muted
                                        />
                                      ) : (
                                        <div className='w-full h-full flex items-center justify-center text-[8px] text-gray-400 font-bold uppercase p-1 text-center'>
                                          Doc
                                        </div>
                                      )}
                                      {!isReadOnly && (
                                        <button
                                          type='button'
                                          onClick={() => handleRemoveModalAsset(asset)}
                                          className='absolute top-1 right-1 p-0.5 bg-red-950/80 border border-red-500/20 text-red-300 rounded-full hover:bg-red-900 transition-all opacity-0 group-hover:opacity-100 shadow-lg'
                                          title='Eliminar archivo'
                                        >
                                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}

                                {pendingFiles.map(asset => {
                                  const mime = asset.mime_type || '';
                                  const isImage = mime.startsWith('image/');
                                  const isVideo = mime.startsWith('video/');
                                  return (
                                    <div
                                      key={asset.id}
                                      className='relative w-16 h-16 rounded-lg overflow-hidden border border-emerald-500/30 bg-emerald-500/5 flex-shrink-0 group'
                                    >
                                      {isImage && asset.preview_url ? (
                                        <img
                                          src={asset.preview_url}
                                          alt={asset.file_name}
                                          className='w-full h-full object-cover group-hover:scale-105 transition-all duration-300'
                                        />
                                      ) : isVideo && asset.preview_url ? (
                                        <video
                                          src={asset.preview_url}
                                          className='w-full h-full object-cover'
                                          muted
                                        />
                                      ) : (
                                        <div className='w-full h-full flex items-center justify-center text-[8px] text-emerald-400 font-bold uppercase p-1 text-center'>
                                          Doc
                                        </div>
                                      )}
                                      <span className='absolute bottom-1 left-1 bg-emerald-500/90 text-[6px] text-black font-extrabold uppercase px-1 rounded-sm shadow-sm tracking-wider'>
                                        Local
                                      </span>
                                      {!isReadOnly && (
                                        <button
                                          type='button'
                                          onClick={() => handleRemoveModalAsset(asset)}
                                          className='absolute top-1 right-1 p-0.5 bg-red-950/80 border border-red-500/20 text-red-300 rounded-full hover:bg-red-900 transition-all opacity-0 group-hover:opacity-100 shadow-lg'
                                          title='Remover archivo'
                                        >
                                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}

                                {!isReadOnly && (
                                  <button
                                    type='button'
                                    onClick={() => document.getElementById('modal-media-input').click()}
                                    className='w-16 h-16 rounded-lg border border-dashed border-white/10 hover:border-white/20 bg-white/5 flex flex-col items-center justify-center gap-0.5 hover:bg-white/10 transition-all flex-shrink-0 group'
                                  >
                                    <PlusIcon className='w-3.5 h-3.5 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all' />
                                    <span className='text-[8px] text-gray-400 font-bold'>Subir</span>
                                  </button>
                                )}

                                {!isEventAIGenOpen && !isReadOnly && (
                                  <button
                                    type='button'
                                    onClick={() => {
                                      setIsEventAIGenOpen(true);
                                      const suggestedPrompt = `${formData.title || ''} ${formData.copy || ''}`.trim().slice(0, 400);
                                      setEventAIPrompt(suggestedPrompt);
                                    }}
                                    className='w-16 h-16 rounded-lg border border-dashed border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5 flex flex-col items-center justify-center gap-0.5 hover:bg-amber-500/10 transition-all flex-shrink-0 group'
                                  >
                                    <SparklesIcon className='w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-all' />
                                    <span className='text-[8px] text-amber-400 font-bold'>IA</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            !isEventAIGenOpen && (
                              isReadOnly ? (
                                <div className='p-6 text-center text-xs text-gray-500 font-semibold'>
                                  No hay archivos multimedia adjuntos.
                                </div>
                              ) : (
                                <div className='flex divide-x divide-white/5'>
                                  <div
                                    onClick={() => document.getElementById('modal-media-input').click()}
                                    className='flex-1 p-4 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white/5 transition-all'
                                  >
                                    <ArrowUpTrayIcon className='w-5 h-5 text-gray-400 group-hover:text-emerald-400 group-hover:-translate-y-0.5 transition-all' />
                                    <p className='mt-1 text-xs font-semibold text-gray-200'>Sube fotos o videos</p>
                                  </div>

                                  <div
                                    onClick={() => {
                                      setIsEventAIGenOpen(true);
                                      const suggestedPrompt = `${formData.title || ''} ${formData.copy || ''}`.trim().slice(0, 400);
                                      setEventAIPrompt(suggestedPrompt);
                                    }}
                                    className='flex-1 p-4 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white/5 transition-all'
                                  >
                                    <SparklesIcon className='w-5 h-5 text-amber-400 group-hover:scale-110 transition-all' />
                                    <p className='mt-1 text-xs font-semibold text-gray-200'>Generar con IA</p>
                                  </div>
                                </div>
                              )
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer de Botones */}
                  <div className='flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-white/5 mt-6 gap-4'>
                    <div>
                      {selectedEvent && !isReadOnly && (
                        <motion.button
                          type='button'
                          onClick={handleDeleteEvent}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className='px-5 py-2 bg-red-950/40 border border-red-500/20 hover:border-red-500/40 hover:bg-red-900/40 text-red-300 font-semibold rounded-xl text-sm transition shadow-sm w-full sm:w-auto'
                        >
                          Eliminar Evento
                        </motion.button>
                      )}
                    </div>

                    <div className='flex items-center gap-3 w-full sm:w-auto justify-end'>
                      {isReadOnly ? (
                        <motion.button
                          type='button'
                          onClick={onClose}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className='px-6 py-2.5 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl text-sm transition shadow w-full sm:w-auto text-center'
                        >
                          Cerrar
                        </motion.button>
                      ) : (
                        <>
                          {selectedEvent && formData.status !== 'Publicado' && (
                            <motion.button
                              type='button'
                              disabled={isPublishing}
                              onClick={() => handlePublishEvent(selectedEvent.id)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition w-full sm:w-auto text-center cursor-pointer flex items-center justify-center gap-2 ${
                                isEventDateToday
                                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse hover:animate-none'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                              }`}
                            >
                              {isPublishing ? (
                                <>
                                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                                  <span>Publicando...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                  <span>{isEventDateToday ? '¡Publicar Hoy Ahora!' : 'Publicar Ahora'}</span>
                                </>
                              )}
                            </motion.button>
                          )}

                          <motion.button
                            type='button'
                            onClick={onClose}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className='px-5 py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition w-full sm:w-auto text-center'
                          >
                            Cancelar
                          </motion.button>

                          <motion.button
                            type='submit'
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className='px-6 py-2.5 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl text-sm transition shadow w-full sm:w-auto text-center'
                          >
                            {selectedEvent ? 'Guardar Cambios' : 'Crear Publicación'}
                          </motion.button>
                        </>
                      )}
                    </div>
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
