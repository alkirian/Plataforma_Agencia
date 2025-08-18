import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon,
  CommandLineIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const KeyboardShortcutsModal = ({ isOpen: isOpenProp, onClose: onCloseProp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { getAllShortcuts } = useAppKeyboardShortcuts();

  // Usar props si están disponibles, sino usar estado interno
  const modalIsOpen = isOpenProp !== undefined ? isOpenProp : isOpen;
  const handleClose = onCloseProp || (() => setIsOpen(false));

  // Escuchar el evento personalizado para mostrar el modal (solo si no se usan props)
  useEffect(() => {
    if (isOpenProp !== undefined) return; // Si se usan props, no usar el evento
    
    const handleShowHelp = () => setIsOpen(true);
    document.addEventListener('show-keyboard-help', handleShowHelp);
    
    return () => {
      document.removeEventListener('show-keyboard-help', handleShowHelp);
    };
  }, [isOpenProp]);

  const allShortcuts = getAllShortcuts();

  // Filtrar atajos por búsqueda
  const filteredShortcuts = allShortcuts.filter(shortcut =>
    shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por categoría
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {});

  const categories = Object.keys(groupedShortcuts).sort();

  return (
    <Transition appear show={modalIsOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl 
                                        bg-surface-900/95 border border-white/10 
                                        shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <CommandLineIcon className="h-6 w-6 text-primary-400" />
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-white">
                        Atajos de Teclado
                      </Dialog.Title>
                      <p className="text-sm text-gray-400 mt-1">
                        Usa estos atajos para navegar más rápidamente
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={handleClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-full p-2 text-gray-400 hover:text-white hover:bg-surface-soft 
                               transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Búsqueda */}
                <div className="p-6 border-b border-white/10">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar atajos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-surface-soft py-2 pl-10 pr-4 
                                 text-white placeholder-gray-400 transition-all 
                                 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Lista de atajos */}
                <div className="max-h-96 overflow-y-auto p-6">
                  {categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No se encontraron atajos que coincidan con tu búsqueda</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <AnimatePresence>
                        {categories.map((category, categoryIndex) => (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: categoryIndex * 0.05 }}
                          >
                            <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wide">
                              {category}
                            </h3>
                            
                            <div className="space-y-2">
                              {groupedShortcuts[category].map((shortcut, index) => (
                                <motion.div
                                  key={shortcut.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: (categoryIndex * 0.05) + (index * 0.02) }}
                                  className="flex items-center justify-between p-3 rounded-lg 
                                             bg-surface-soft border border-white/10 hover:bg-surface-strong 
                                             transition-colors"
                                >
                                  <span className="text-white text-sm">
                                    {shortcut.description}
                                  </span>
                                  
                                  <div className="flex items-center space-x-1">
                                    {shortcut.shortcut.split(' + ').map((key, keyIndex) => (
                                      <React.Fragment key={keyIndex}>
                                        {keyIndex > 0 && (
                                          <span className="text-gray-400 text-xs">+</span>
                                        )}
                                        <kbd className="px-2 py-1 bg-gray-700 text-gray-300 rounded 
                                                       text-xs font-mono border border-gray-600 
                                                       shadow-sm min-w-[24px] text-center">
                                          {key}
                                        </kbd>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/20">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      <strong>{allShortcuts.length}</strong> atajos disponibles
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Presiona <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">Escape</kbd> para cerrar
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export { KeyboardShortcutsModal };
