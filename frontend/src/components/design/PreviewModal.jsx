import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useEscapeClose } from '../../hooks';

export const PreviewModal = ({ previewImage, onClose, handleDownload }) => {
  useEscapeClose(!!previewImage, onClose);

  return (
    <AnimatePresence>
      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.93, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative max-w-full max-h-[90vh] bg-surface-strong/90 border border-border-strong rounded-2xl p-5 shadow-2xl flex flex-col gap-4 overflow-hidden z-50 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-white tracking-wider">{previewImage.name}</span>
                <span className="text-[9px] font-bold text-text-muted uppercase">Relación de Aspecto {previewImage.ratio}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Imagen a Escala */}
            <div className="flex-grow flex items-center justify-center bg-black/20 rounded-xl border border-border-subtle p-3 overflow-hidden max-h-[65vh] max-w-[90vw]">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Acciones del Modal */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-wider text-text-secondary cursor-pointer transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleDownload(previewImage.url, previewImage.ratio.replace(':', '-'))}
                className="px-4 py-2 rounded-xl bg-accent-violet hover:bg-accent-violet/85 text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Descargar Alta Calidad</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;
