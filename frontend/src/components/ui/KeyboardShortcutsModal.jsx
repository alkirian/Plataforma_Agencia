import React, { useState, useEffect } from 'react'
import { Terminal, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from './Modal'
import { useAppKeyboardShortcuts } from '@shared/hooks/useKeyboardShortcuts'

const KeyboardShortcutsModal = ({ isOpen = false, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const { getAllShortcuts } = useAppKeyboardShortcuts()

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  const allShortcuts = getAllShortcuts()

  // Filtrar atajos por búsqueda
  const filteredShortcuts = allShortcuts.filter(
    shortcut =>
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Agrupar por categoría
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(shortcut)
    return acc
  }, {})

  const categories = Object.keys(groupedShortcuts).sort()

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title='Atajos de Teclado'
      description='Usa estos atajos para navegar más rápidamente'
      size='lg'
      icon={<Terminal className='h-6 w-6 text-primary-400' />}
      footer={
        <div className='flex items-center justify-between'>
          <div className='text-xs text-text-muted'>
            <strong>{allShortcuts.length}</strong> atajos disponibles
          </div>
          <div className='text-xs text-text-muted'>
            Presiona <kbd className='px-1 py-0.5 bg-gray-700 rounded text-gray-300'>Escape</kbd>{' '}
            para cerrar
          </div>
        </div>
      }
    >
      {/* Búsqueda */}
      <div className='mb-6'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted' />
          <input
            type='text'
            placeholder='Buscar atajos...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full rounded-lg border border-white/10 bg-surface-soft py-2 pl-10 pr-4 
                       text-text-primary placeholder-text-muted transition-all 
                       focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20'
          />
        </div>
      </div>

      {/* Lista de atajos */}
      <div className='max-h-80 overflow-y-auto custom-scrollbar'>
        {categories.length === 0 ? (
          <div className='text-center py-8 text-text-muted'>
            <Search className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p>No se encontraron atajos que coincidan con tu búsqueda</p>
          </div>
        ) : (
          <div className='space-y-6'>
            <AnimatePresence>
              {categories.map((category, categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: categoryIndex * 0.05 }}
                >
                  <h3 className='text-sm font-medium text-text-muted mb-3 uppercase tracking-wide'>
                    {category}
                  </h3>

                  <div className='space-y-2'>
                    {groupedShortcuts[category].map((shortcut, index) => (
                      <motion.div
                        key={shortcut.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: categoryIndex * 0.05 + index * 0.02 }}
                        className='flex items-center justify-between p-3 rounded-lg 
                                   bg-surface-soft border border-white/10 hover:bg-white/10 
                                   transition-colors'
                      >
                        <span className='text-text-primary text-sm'>{shortcut.description}</span>

                        <div className='flex items-center space-x-1'>
                          {shortcut.shortcut.split(' + ').map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              {keyIndex > 0 && <span className='text-text-muted text-xs'>+</span>}
                              <kbd
                                className='px-2 py-1 bg-gray-700/50 text-text-primary rounded 
                                           text-xs font-mono border border-white/20 
                                           shadow-sm min-w-[24px] text-center'
                              >
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
    </Modal>
  )
}

export { KeyboardShortcutsModal }
