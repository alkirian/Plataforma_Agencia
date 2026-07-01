// src/components/schedule/ShareApprovalModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LinkIcon,
  CheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getClientApprovalLink, createClientApprovalLink } from '../../api/shared.js';
import { useLanguage, useEscapeClose } from '../../hooks';

export const ShareApprovalModal = ({ isOpen, onClose, clientId, clientName }) => {
  useEscapeClose(isOpen, onClose);
  const { t } = useLanguage();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLink = async () => {
    setLoading(true);
    try {
      const data = await getClientApprovalLink(clientId);
      setLink(data);
    } catch (err) {
      console.error('Error fetching approval link:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && clientId) {
      fetchLink();
    }
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsSubmitting(true);
    try {
      const data = await createClientApprovalLink(clientId);
      setLink(data);
      toast.success(t.schedule.shareModal.successGenerate);
    } catch (err) {
      toast.error(t.schedule.shareModal.errorGenerate + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!link) return;
    const shareableUrl = `${window.location.origin}/shared/approval/${link.id}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    toast.success(t.schedule.linkCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareableUrl = link ? `${window.location.origin}/shared/approval/${link.id}` : '';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className='w-full max-w-md bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5'
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border-subtle pb-3'>
          <h3 className='text-sm font-bold text-text-primary flex items-center gap-1.5'>
            <LinkIcon className='h-4 w-4 text-[#8FA89B]' />
            {t.schedule.shareModal.title}: {clientName}
          </h3>
          <button onClick={onClose} className='text-text-muted hover:text-text-primary text-xs'>
            ✕
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className='py-12 flex flex-col items-center justify-center gap-2'>
            <ArrowPathIcon className='h-6 w-6 text-text-muted animate-spin' />
            <p className='text-xs text-text-muted'>{t.schedule.shareModal.loading}</p>
          </div>
        ) : !link ? (
          /* Empty State: Link not generated yet */
          <div className='py-6 text-center space-y-4'>
            <div className='w-12 h-12 rounded-xl bg-surface-strong border border-border-subtle flex items-center justify-center mx-auto'>
              <LinkIcon className='h-6 w-6 text-text-muted' />
            </div>
            <div>
              <p className='text-xs text-text-primary font-semibold'>
                {t.schedule.shareModal.noLink}
              </p>
              <p className='text-[11px] text-text-muted mt-1 leading-relaxed max-w-xs mx-auto'>
                {t.schedule.shareModal.noLinkDesc}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isSubmitting}
              className='btn-cyber w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5'
            >
              {isSubmitting ? (
                <ArrowPathIcon className='h-3.5 w-3.5 animate-spin' />
              ) : (
                <LinkIcon className='h-3.5 w-3.5' />
              )}
              {t.schedule.shareModal.generateBtn}
            </button>
          </div>
        ) : (
          /* Link active state */
          <div className='space-y-4'>
            {/* Shareable Link Input */}
            <div className='space-y-1.5'>
              <label className='block text-[10px] font-bold text-text-muted uppercase tracking-wider'>
                {t.schedule.shareModal.shareableLink}
              </label>
              <div className='flex gap-2'>
                <input
                  type='text'
                  readOnly
                  value={shareableUrl}
                  onClick={handleCopy}
                  className='input-cyber flex-1 py-2 px-3 text-xs cursor-pointer select-all truncate'
                />
                <button
                  onClick={handleCopy}
                  className='bg-surface-strong hover:bg-surface-soft text-text-primary border border-border-subtle px-3.5 rounded-xl flex items-center justify-center transition-all flex-shrink-0'
                  title={t.schedule.copyLinkBtn}
                >
                  {copied ? (
                    <CheckIcon className='h-4 w-4 text-[#8FA89B]' />
                  ) : (
                    <CheckIcon className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Warning Alert */}
            <div className='rounded-xl bg-[#8FA89B]/10 border border-[#8FA89B]/30 px-3.5 py-3 flex items-start gap-2.5'>
              <ExclamationTriangleIcon className='h-4 w-4 text-[#8FA89B] mt-0.5 flex-shrink-0' />
              <div className='text-[11px] text-text-primary leading-relaxed'>
                <span className='font-bold'>{t.schedule.shareModal.warningTitle}</span>: {t.schedule.shareModal.warningDesc}
              </div>
            </div>

            {/* Test Link Action */}
            <a
              href={shareableUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='w-full py-2.5 rounded-xl border border-border-strong hover:border-[#8FA89B]/50 flex items-center justify-center gap-1.5 text-xs font-semibold text-text-primary transition-all duration-150'
            >
              <ArrowTopRightOnSquareIcon className='h-4 w-4 text-[#9BA1BA]' />
              {t.schedule.shareModal.viewPortal}
            </a>

            {/* Revoke / Regenerate */}
            <div className='pt-3 border-t border-border-subtle flex items-center justify-between gap-4'>
              <span className='text-[10px] text-text-muted'>
                {t.schedule.shareModal.invalidatePrompt}
              </span>
              <button
                onClick={handleGenerate}
                disabled={isSubmitting}
                className='text-[10px] font-bold text-[#fe0979] hover:text-[#ff3883] transition-colors'
              >
                {t.schedule.shareModal.regenerateBtn}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
