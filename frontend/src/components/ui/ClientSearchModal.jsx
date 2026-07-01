import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEscapeClose } from '../../hooks';
import { getClients } from '../../api/clients';

export const ClientSearchModal = ({ isOpen, onClose }) => {
  useEscapeClose(isOpen, onClose);
  const [term, setTerm] = React.useState('');
  const [clients, setClients] = React.useState([]);
  const [filteredClients, setFilteredClients] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const navigate = useNavigate();
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      getClients()
        .then(res => {
          const list = res?.data ?? res ?? [];
          setClients(list);
        })
        .catch(err => console.error('Error fetching clients for search:', err));
    } else {
      setTerm('');
      setFilteredClients([]);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const q = term.toLowerCase().trim();
    if (!q) {
      setFilteredClients([]);
      setSelectedIndex(0);
      return;
    }
    const filtered = clients.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.industry?.toLowerCase().includes(q)
    );
    setFilteredClients(filtered);
    setSelectedIndex(0);
  }, [term, clients]);

  const submit = e => {
    e?.preventDefault();
    const q = term.trim();
    if (!q) return;
    
    if (filteredClients.length > 0 && selectedIndex < filteredClients.length) {
      handleClientClick(filteredClients[selectedIndex]);
    } else {
      navigate(`/dashboard?q=${encodeURIComponent(q)}`);
      onClose?.();
    }
  };

  const handleClientClick = client => {
    navigate(`/clients/${client.id}`);
    onClose?.();
  };

  const handleKeyDown = e => {
    if (filteredClients.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredClients.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredClients.length) % filteredClients.length);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className='fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-6'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal='true'
          role='dialog'
        >
          <div className='absolute inset-0 bg-black/50' onClick={onClose} />
          <motion.form
            onSubmit={submit}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className='relative w-full max-w-2xl rounded-xl border border-[color:var(--color-border-subtle)] bg-surface-strong shadow-xl no-focus-within overflow-hidden'
          >
            <div className='flex items-center gap-3 p-4'>
              <MagnifyingGlassIcon className='h-6 w-6 text-text-muted' />
              <input
                ref={inputRef}
                type='text'
                value={term}
                onChange={e => setTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Buscar clientes por nombre o industria…'
                className='flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-base
                 border border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2
                 focus:border-[color:var(--color-border-strong)] focus:ring-1 focus:ring-[rgba(163,163,163,0.25)]'
                aria-label='Buscar clientes'
              />
              <button
                type='button'
                onClick={onClose}
                className='p-2 rounded-lg text-text-muted hover:text-text-primary border border-transparent hover-surface'
                aria-label='Cerrar búsqueda'
              >
                <XMarkIcon className='h-5 w-5' />
              </button>
            </div>

            {filteredClients.length > 0 && (
              <div className='max-h-[300px] overflow-y-auto border-t border-[color:var(--color-border-subtle)]'>
                {filteredClients.map((client, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={client.id}
                      onClick={() => handleClientClick(client)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 ${
                        isSelected ? 'bg-surface-soft text-text-primary' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className='h-8 w-8 rounded-lg object-cover border border-white/10'
                          />
                        ) : (
                          <div className='h-8 w-8 rounded-lg bg-accent-lavender/20 border border-accent-lavender/30 text-accent-lavender flex items-center justify-center font-bold text-sm'>
                            {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div className='flex flex-col'>
                          <span className='text-sm font-semibold'>{client.name}</span>
                          {client.industry && (
                            <span className='text-[11px] text-text-muted'>{client.industry}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <span className='text-[11px] font-medium text-text-muted bg-surface-strong px-2 py-0.5 rounded border border-white/5 flex items-center gap-1 select-none'>
                          Abrir <span className='text-[9px]'>↵</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {term.trim() && (
              <div className='px-4 py-4 border-t border-[color:var(--color-border-subtle)] bg-surface-strong/50'>
                <button
                  type='submit'
                  className='btn-cyber w-full justify-center text-xs'
                  aria-label='Ejecutar búsqueda de clientes'
                >
                  Buscar “{term.trim()}” en el Dashboard
                </button>
              </div>
            )}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
