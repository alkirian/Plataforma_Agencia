// src/pages/ApprovalPortalPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  CalendarDaysIcon,
  SignalIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';
import toast, { Toaster } from 'react-hot-toast';
import {
  getSharedApprovalDetails,
  sharedApprovePost,
  sharedFeedbackPost,
  sharedRevertPost,
} from '../api/shared.js';
import { useLanguage } from '../hooks';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatPostDate = (iso, lang) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const channelBadge = ch => {
  const map = {
    IG: {
      label: 'Instagram',
      cls: 'bg-gradient-to-r from-[#8a3ab9] via-[#e95950] to-[#fccc63] text-white',
    },
    TikTok: { label: 'TikTok', cls: 'bg-black text-[#00f2fe] border border-[#fe0979]/40' },
    LinkedIn: { label: 'LinkedIn', cls: 'bg-[#0077b5] text-white' },
    YT: { label: 'YouTube', cls: 'bg-[#ff0000] text-white' },
    FB: { label: 'Facebook', cls: 'bg-[#1877f2] text-white' },
    Twitter: { label: 'X (Twitter)', cls: 'bg-[#14171A] text-white border border-white/20' },
  };
  return map[ch] || { label: ch || 'Post', cls: 'bg-surface-soft text-text-primary' };
};

// ─────────────────────────────────────────────
// Post Card Component
// ─────────────────────────────────────────────
const PostCard = ({ item, token, onUpdateItem }) => {
  const { t, lang } = useLanguage();
  const [feedbackText, setFeedbackText] = useState('');
  const [isExpandingFeedback, setIsExpandingFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chBadge = channelBadge(item.channel);
  const isApproved = item.status === 'Aprobado';
  const hasFeedback = !!item.client_feedback;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const resp = await sharedApprovePost(token, item.id);
      if (resp.success) {
        toast.success(lang === 'es' ? '¡Post aprobado con éxito!' : 'Post approved successfully!', { icon: '✅' });
        onUpdateItem(item.id, { status: 'Aprobado', client_feedback: '' });
      }
    } catch (err) {
      toast.error((lang === 'es' ? 'Error al aprobar: ' : 'Error approving: ') + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendFeedback = async e => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    try {
      const resp = await sharedFeedbackPost(token, item.id, feedbackText.trim());
      if (resp.success) {
        toast.success(lang === 'es' ? 'Feedback de ajuste enviado.' : 'Adjustment feedback sent.');
        onUpdateItem(item.id, { status: 'En Diseño', client_feedback: feedbackText.trim() });
        setFeedbackText('');
        setIsExpandingFeedback(false);
      }
    } catch (err) {
      toast.error((lang === 'es' ? 'Error al enviar feedback: ' : 'Error sending feedback: ') + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevert = async () => {
    setIsSubmitting(true);
    try {
      const resp = await sharedRevertPost(token, item.id);
      if (resp.success) {
        toast.success(lang === 'es' ? 'Aprobación revertida.' : 'Approval reverted.', { icon: '🔄' });
        onUpdateItem(item.id, { status: 'En Diseño', client_feedback: '' });
      }
    } catch (err) {
      toast.error((lang === 'es' ? 'Error al deshacer aprobación: ' : 'Error undoing approval: ') + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-cyber p-6 flex flex-col gap-4 border transition-all duration-200 ${
        isApproved
          ? 'border-[#8FA89B]/40 hover:border-[#8FA89B]/60 bg-[#f0fbf6] dark:bg-[#161917]/90'
          : 'border-border-subtle hover:border-border-strong bg-surface'
      }`}
    >
      {/* Date & Channel Header */}
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <span className='flex items-center gap-1.5 text-xs text-text-muted capitalize'>
          <CalendarDaysIcon className='h-4 w-4 text-text-muted' />
          {formatPostDate(item.scheduled_at, lang)}
        </span>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${chBadge.cls}`}
        >
          {chBadge.label}
        </span>
      </div>

      {/* Post Title */}
      <h3 className='text-base font-bold text-text-primary leading-tight'>{item.title}</h3>

      {/* Copy / Text */}
      <div className='rounded-xl bg-surface-soft/40 border border-border-subtle/30 p-4'>
        <p className='text-xs text-text-muted font-semibold uppercase tracking-wider mb-2'>
          {lang === 'es' ? 'Copia del Post' : 'Post Copy'}
        </p>
        <p className='text-sm text-text-primary whitespace-pre-line leading-relaxed'>
          {item.description || (lang === 'es' ? 'Sin copia redactada.' : 'No copy drafted.')}
        </p>
      </div>

      {/* Visual Assets Carousel / Grid */}
      {item.assets && item.assets.length > 0 && (
        <div className='space-y-2'>
          <p className='text-[10px] text-text-muted font-bold uppercase tracking-wider flex items-center gap-1'>
            <PaperClipIcon className='h-3 w-3' />
            {lang === 'es' ? 'Material de Diseño / Referencia' : 'Design Material / Reference'}
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {item.assets.map((asset, i) => (
              <a
                key={asset.id || i}
                href={asset.preview_url}
                target='_blank'
                rel='noopener noreferrer'
                className='relative rounded-xl overflow-hidden border border-border-subtle group aspect-[4/3] bg-black'
              >
                {asset.mime_type?.startsWith('image/') ? (
                  <img
                    src={asset.preview_url}
                    alt={asset.file_name}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-xs text-text-muted'>
                    {asset.file_name}
                  </div>
                )}
                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white'>
                  {lang === 'es' ? 'Ver pantalla completa' : 'View full screen'}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Existing Feedback */}
      {hasFeedback && (
        <div className='rounded-xl bg-[#7c5cfc]/5 dark:bg-[#A19EA6]/10 border border-[#7c5cfc]/20 dark:border-[#A19EA6]/30 px-4 py-3 flex items-start gap-2.5'>
          <ChatBubbleLeftRightIcon className='h-4 w-4 text-[#7c5cfc] dark:text-[#A19EA6] mt-0.5 flex-shrink-0' />
          <div>
            <p className='text-[10px] text-[#7c5cfc] dark:text-[#A19EA6] font-bold uppercase tracking-wider mb-0.5'>
              {lang === 'es' ? 'Ajustes Solicitados' : 'Requested Adjustments'}
            </p>
            <p className='text-xs text-text-primary leading-relaxed italic'>
              "{item.client_feedback}"
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='mt-auto pt-4 border-t border-border-subtle/30 flex flex-col gap-3'>
        {isApproved ? (
          <div className='flex flex-col gap-2'>
            <div className='w-full py-2.5 rounded-xl bg-[#8FA89B]/10 border border-[#8FA89B]/30 flex items-center justify-center gap-2 text-xs font-bold text-[#8FA89B]'>
              <SolidCheckCircleIcon className='h-5 w-5' />
              {lang === 'es' ? 'Post Aprobado para Publicar' : 'Post Approved to Publish'}
            </div>
            <button
              disabled={isSubmitting}
              onClick={handleRevert}
              className='w-full py-2 px-4 rounded-xl border border-dashed border-[#fe0979]/30 hover:border-[#fe0979]/60 bg-[#fe0979]/5 hover:bg-[#fe0979]/10 text-xs font-bold text-[#fe0979] flex items-center justify-center gap-1.5 transition-all duration-150'
            >
              {isSubmitting ? (
                <ArrowPathIcon className='h-3.5 w-3.5 animate-spin' />
              ) : (
                lang === 'es' ? 'Deshacer Aprobación' : 'Undo Approval'
              )}
            </button>
          </div>
        ) : (
          <div className='flex items-center gap-3'>
            {/* Request Adjustments Button */}
            {!isExpandingFeedback && (
              <button
                disabled={isSubmitting}
                onClick={() => setIsExpandingFeedback(true)}
                className='flex-1 py-2 px-4 rounded-xl border border-border-strong hover:border-text-primary text-xs font-semibold text-text-primary transition-all duration-150'
              >
                {t.approvalPortal.rejectAction}
              </button>
            )}

            {/* Approve Button */}
            {!isExpandingFeedback && (
              <button
                disabled={isSubmitting}
                onClick={handleApprove}
                className='flex-1 btn-cyber py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold'
              >
                {isSubmitting ? (
                  <ArrowPathIcon className='h-4 w-4 animate-spin' />
                ) : (
                  <CheckCircleIcon className='h-4 w-4 text-[#8FA89B]' />
                )}
                {t.approvalPortal.approveAction}
              </button>
            )}
          </div>
        )}

        {/* Feedback expansion block */}
        <AnimatePresence>
          {isExpandingFeedback && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSendFeedback}
              className='space-y-3 overflow-hidden'
            >
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder={t.approvalPortal.commentPlaceholder}
                className='input-cyber w-full py-2.5 px-3 text-xs h-20 resize-none'
                required
              />
              <div className='flex items-center justify-end gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    setIsExpandingFeedback(false);
                    setFeedbackText('');
                  }}
                  className='px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors'
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type='submit'
                  disabled={isSubmitting || !feedbackText.trim()}
                  className='btn-cyber bg-[#7c5cfc] text-white hover:bg-[#60A5FA] px-4 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 border-transparent'
                >
                  {t.approvalPortal.saveComment}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────
export const ApprovalPortalPage = () => {
  const { t, lang } = useLanguage();
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // all | pending | approved

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSharedApprovalDetails(token);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || t.approvalPortal.shareExpired);
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleUpdateItem = (itemId, updates) => {
    setData(prev => {
      if (!prev) return null;
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        return item;
      });
      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-app flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 rounded-full border-2 border-border-strong border-t-transparent animate-spin' />
          <p className='text-xs text-text-muted'>
            {lang === 'es' ? 'Cargando cronograma compartido...' : 'Loading shared calendar...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-app flex items-center justify-center p-4'>
        <div className='max-w-md w-full bg-surface border border-[#fe0979]/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl'>
          <div className='w-12 h-12 rounded-full bg-[#fe0979]/10 border border-[#fe0979]/30 flex items-center justify-center mx-auto'>
            <ExclamationCircleIcon className='h-6 w-6 text-[#fe0979]' />
          </div>
          <h2 className='text-lg font-bold text-text-primary'>
            {lang === 'es' ? 'Enlace No Válido' : 'Invalid Link'}
          </h2>
          <p className='text-xs text-text-muted leading-relaxed'>
            {error}. {lang === 'es' ? 'Comunícate con tu agencia de publicidad para solicitar un nuevo enlace de aprobación vigente.' : 'Please contact your advertising agency to request a new valid approval link.'}
          </p>
        </div>
      </div>
    );
  }

  const { client, agency, items } = data;

  // Filtrado
  const filteredItems = items.filter(item => {
    if (activeFilter === 'pending') return item.status !== 'Aprobado';
    if (activeFilter === 'approved') return item.status === 'Aprobado';
    return true;
  });

  const pendingCount = items.filter(item => item.status !== 'Aprobado').length;
  const approvedCount = items.filter(item => item.status === 'Aprobado').length;

  return (
    <div className='min-h-screen bg-app text-text-primary pb-16'>
      <Toaster position='top-center' reverseOrder={false} />

      {/* ─── Premium Standalone Header ─── */}
      <header className='sticky top-0 z-40 header-cyber bg-surface/80 backdrop-blur-md'>
        <div className='max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-[#2C2930] to-[#121220] dark:from-[#2C2930] dark:to-black border border-border-subtle flex items-center justify-center font-bold text-text-primary text-sm'>
              C
            </div>
            <div>
              <h1 className='text-sm font-bold text-text-primary flex items-center gap-1.5'>
                {t.approvalPortal.title}
                <span className='px-2 py-0.5 rounded-full bg-surface-soft border border-border-subtle text-[10px] text-text-muted font-normal'>
                  {lang === 'es' ? 'Cliente' : 'Client'}
                </span>
              </h1>
              <p className='text-[10px] text-text-muted mt-0.5'>
                {lang === 'es' ? 'Revisión de calendario · Desarrollado por' : 'Calendar review · Powered by'}{' '}
                <span className='font-semibold text-text-primary'>{agency.name}</span>
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <span className='w-1.5 h-1.5 rounded-full bg-[#8FA89B] animate-pulse' />
            <span className='text-[10px] text-text-muted font-semibold uppercase tracking-wider'>
              {lang === 'es' ? 'Conexión Segura' : 'Secure Connection'}
            </span>
          </div>
        </div>
      </header>

      {/* ─── Content container ─── */}
      <main className='max-w-4xl mx-auto px-4 pt-8 space-y-6'>
        {/* Brand Banner */}
        <div className='rounded-2xl border border-border-subtle bg-surface-soft/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <span className='text-[10px] font-bold text-[#9BA1BA] uppercase tracking-wider'>
              {lang === 'es' ? 'Marca' : 'Brand'}
            </span>
            <h2 className='text-xl font-black text-text-primary mt-0.5'>{client.name}</h2>
          </div>

          {/* Summary Stats */}
          <div className='flex items-center gap-4'>
            <div className='bg-surface-soft border border-border-subtle px-4 py-2 rounded-xl text-center'>
              <p className='text-[10px] text-text-muted font-semibold uppercase tracking-wider'>
                {lang === 'es' ? 'Pendientes' : 'Pending'}
              </p>
              <p className='text-lg font-black text-text-primary mt-0.5'>{pendingCount}</p>
            </div>
            <div className='bg-surface-soft border border-border-subtle px-4 py-2 rounded-xl text-center'>
              <p className='text-[10px] text-text-muted font-semibold uppercase tracking-wider'>
                {lang === 'es' ? 'Aprobados' : 'Approved'}
              </p>
              <p className='text-lg font-black text-[#8FA89B] mt-0.5'>{approvedCount}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className='flex items-center justify-start border-b border-border-subtle pb-3 gap-2 flex-wrap'>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-text-primary text-white dark:text-[#07070e] font-black'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
            }`}
          >
            {lang === 'es' ? 'Todos' : 'All'} ({items.length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'pending'
                ? 'bg-text-primary text-white dark:text-[#07070e] font-black'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
            }`}
          >
            {lang === 'es' ? 'Pendientes' : 'Pending'} ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'approved'
                ? 'bg-text-primary text-white dark:text-[#07070e] font-black'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
            }`}
          >
            {lang === 'es' ? 'Aprobados' : 'Approved'} ({approvedCount})
          </button>
        </div>

        {/* Posts Grid */}
        <motion.div layout className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <PostCard key={item.id} item={item} token={token} onUpdateItem={handleUpdateItem} />
            ))
          ) : (
            <div className='col-span-full py-16 text-center text-xs text-text-muted bg-surface-soft/20 border border-dashed border-border-subtle rounded-2xl'>
              {lang === 'es' ? 'No hay publicaciones en esta sección.' : 'There are no publications in this section.'}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};
