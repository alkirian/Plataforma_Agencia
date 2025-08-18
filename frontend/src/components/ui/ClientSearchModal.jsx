import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const ClientSearchModal = ({ isOpen, onClose }) => {
  const [term, setTerm] = React.useState('');
  const navigate = useNavigate();
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTerm('');
    }
  }, [isOpen]);

  const submit = (e) => {
    e?.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/dashboard?q=${encodeURIComponent(q)}`);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.form
            onSubmit={submit}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="relative w-full max-w-2xl rounded-xl border border-[color:var(--color-border-subtle)] bg-surface-strong shadow-xl no-focus-within"
          >
            <div className="flex items-center gap-3 p-4">
              <MagnifyingGlassIcon className="h-6 w-6 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar clientes por nombre o industria…"
                className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-base
                 border border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2
                 focus:border-[color:var(--color-border-strong)] focus:ring-1 focus:ring-[rgba(163,163,163,0.25)]"
                aria-label="Buscar clientes"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary border border-transparent hover-surface"
                aria-label="Cerrar búsqueda"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {term.trim() && (
              <div className="px-4 pb-4">
                <button
                  type="submit"
                  className="btn-cyber w-full justify-center"
                  aria-label="Ejecutar búsqueda de clientes"
                >
                  Buscar “{term.trim()}”
                </button>
              </div>
            )}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
