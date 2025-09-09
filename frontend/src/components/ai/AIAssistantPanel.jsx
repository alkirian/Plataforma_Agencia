import React, { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Minus, X, PanelRightOpen, PanelLeftOpen } from 'lucide-react'
import { Button } from '@components/ui'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

const AIAssistant = lazy(() => import('./AIAssistant.jsx').then(m => ({ default: m.AIAssistant })))

const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches

export const AIAssistantPanel = ({ open, minimized, onMinimize, onClose }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [dockedSide, setDockedSide] = useState('right') // 'left' | 'right'
  const [docked, setDocked] = useState(false)
  const [edges, setEdges] = useState({ top: 8, bottom: 8 })
  const panelRef = useRef(null)
  const dragControls = useDragControls()
  const openedOnceRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai:panel:pos')
      const dock = localStorage.getItem('ai:panel:dock')
      const mode = localStorage.getItem('ai:panel:mode')

      // Default sensible: si no hay preferencias guardadas, anclar a la derecha
      if (!dock) localStorage.setItem('ai:panel:dock', 'right')
      if (!mode) localStorage.setItem('ai:panel:mode', 'docked')

      // Aplicar estado desde storage o defaults
      if (dock === 'left' || dock === 'right') {
        setDockedSide(dock)
      } else {
        setDockedSide('right')
      }
      if (mode === 'docked' || !mode) {
        setDocked(true)
      }

      if (raw) {
        const p = JSON.parse(raw)
        if (typeof p.top === 'number' && typeof p.left === 'number') setPos(p)
      } else {
        // default bottom-right position (solo aplica en modo flotante)
        const vw = window.innerWidth
        const vh = window.innerHeight
        setPos({ top: Math.max(8, vh - 520), left: Math.max(8, vw - 400) })
      }
    } catch (_) {}
  }, [])

  // Al abrir por primera vez en la sesión, forzar anclado a la derecha si no está dockeado
  useEffect(() => {
    if (!open) return
    if (openedOnceRef.current) return
    openedOnceRef.current = true
    try {
      const storedMode = localStorage.getItem('ai:panel:mode')
      const storedDock = localStorage.getItem('ai:panel:dock')
      if (storedMode !== 'docked') {
        setDockedSide('right')
        setDocked(true)
        localStorage.setItem('ai:panel:mode', 'docked')
        localStorage.setItem('ai:panel:dock', 'right')
      } else if (storedDock !== 'left' && storedDock !== 'right') {
        setDockedSide('right')
        localStorage.setItem('ai:panel:dock', 'right')
      }
    } catch (_) {}
  }, [open])

  useEffect(() => {
    const onResize = () => {
      const vh = window.innerHeight
      const headerEl = document.querySelector('.header-cyber')
      const footerEl = document.querySelector('footer')
      const headerH = headerEl?.offsetHeight || 64
      const footerH = footerEl?.offsetHeight || 0
      setEdges({ top: headerH + 8, bottom: footerH + 8 })
      // Clamp position inside viewport
      const vw = window.innerWidth
      let panelWidth = 380
      try {
        if (panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect()
          if (rect?.width) panelWidth = rect.width
        }
      } catch (_) {}
      setPos(p => ({
        top: Math.max(8, Math.min(vh - 120, p.top)),
        left: Math.max(8, Math.min(vw - panelWidth - 8, p.left)),
      }))
    }
    if (typeof window !== 'undefined') {
      onResize()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }
    return () => {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('ai:panel:pos', JSON.stringify(pos))
    } catch (_) {}
  }, [pos])
  useEffect(() => {
    try {
      localStorage.setItem('ai:panel:dock', dockedSide)
    } catch (_) {}
  }, [dockedSide])
  useEffect(() => {
    try {
      localStorage.setItem('ai:panel:mode', docked ? 'docked' : 'float')
    } catch (_) {}
  }, [docked])

  // Close on ESC and click-outside
  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key === 'Escape') onClose?.()
    }
    const onClick = e => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target)) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open, onClose])

  // Update body dataset to push layout when docked
  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    try {
      if (docked) {
        body.dataset.aiDock = dockedSide
        body.style.setProperty('--ai-dock-width', 'clamp(320px, 28vw, 420px)')
      } else {
        delete body.dataset.aiDock
      }
    } catch (_) {}
    return () => {}
  }, [docked, dockedSide])

  const snapToEdge = () => {
    const vw = window.innerWidth
    let panelWidth = 380
    try {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        if (rect?.width) panelWidth = rect.width
      }
    } catch (_) {}
    const margin = 8
    setPos(p => ({
      ...p,
      left: p.left < vw / 2 ? margin : Math.max(margin, vw - panelWidth - margin),
    }))
  }

  if (!open) return null

  const mobile = isMobile()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key='ai-panel'
          ref={panelRef}
          className={`fixed z-[70]`}
          style={
            mobile
              ? { left: 0, right: 0, bottom: 0 }
              : docked
                ? dockedSide === 'right'
                  ? {
                      right: 0,
                      top: edges.top,
                      bottom: edges.bottom,
                      width: 'clamp(320px, 28vw, 420px)',
                    }
                  : {
                      left: 0,
                      top: edges.top,
                      bottom: edges.bottom,
                      width: 'clamp(320px, 28vw, 420px)',
                    }
                : { top: pos.top, left: pos.left, width: 'clamp(320px, 28vw, 420px)' }
          }
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            key={docked ? `dock-${dockedSide}` : 'float'}
            className={`rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)] shadow-2xl overflow-hidden ${mobile ? (minimized ? 'h-[44px] mx-3' : 'h-[70vh] mx-3') : docked ? (minimized ? 'h-[44px]' : 'h-full') : minimized ? 'h-[44px]' : 'h-[480px]'}`}
            drag={!mobile && !docked}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={docked ? { x: 0, y: 0 } : undefined}
            animate={docked ? { x: 0, y: 0 } : undefined}
            onDragStart={e => {
              if (docked) {
                try {
                  if (panelRef.current) {
                    const rect = panelRef.current.getBoundingClientRect()
                    setPos({ top: rect.top, left: rect.left })
                  }
                } catch (_) {}
                setDocked(false)
              }
            }}
            onDragEnd={snapToEdge}
          >
            {/* Header grip */}
            <div
              className='flex items-center justify-between px-3 py-2 border-b border-[color:var(--color-border-subtle)] cursor-move select-none'
              onPointerDown={e => {
                if (mobile) return
                if (docked) {
                  // Capturar posición actual en pantalla para evitar salto al desanclar
                  try {
                    if (panelRef.current) {
                      const rect = panelRef.current.getBoundingClientRect()
                      setPos({ top: rect.top, left: rect.left })
                    }
                  } catch (_) {}
                  // Undock y comenzar drag en el siguiente frame
                  setDocked(false)
                  requestAnimationFrame(() => dragControls.start(e))
                } else {
                  dragControls.start(e)
                }
              }}
            >
              <div className='text-sm font-medium'>Asistente IA</div>
              <div className='flex items-center gap-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2 hover:bg-[color:var(--color-surface)]'
                  onPointerDown={e => {
                    e.stopPropagation()
                  }}
                  onMouseDown={e => {
                    e.stopPropagation()
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    setDockedSide('left')
                    setDocked(true)
                    try {
                      localStorage.setItem('ai:panel:mode', 'docked')
                      localStorage.setItem('ai:panel:dock', 'left')
                    } catch (_) {}
                  }}
                  title='Anclar a la izquierda'
                  aria-label='Anclar a la izquierda'
                  icon={<PanelLeftOpen className='h-4 w-4' />}
                />
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2 hover:bg-[color:var(--color-surface)]'
                  onPointerDown={e => {
                    e.stopPropagation()
                  }}
                  onMouseDown={e => {
                    e.stopPropagation()
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    setDockedSide('right')
                    setDocked(true)
                    try {
                      localStorage.setItem('ai:panel:mode', 'docked')
                      localStorage.setItem('ai:panel:dock', 'right')
                    } catch (_) {}
                  }}
                  title='Anclar a la derecha'
                  aria-label='Anclar a la derecha'
                  icon={<PanelRightOpen className='h-4 w-4' />}
                />
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 hover:bg-[color:var(--color-surface)]'
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    onMinimize?.()
                  }}
                  title={minimized ? 'Restaurar' : 'Minimizar'}
                  aria-label={minimized ? 'Restaurar asistente' : 'Minimizar asistente'}
                  icon={<Minus className='h-4 w-4' />}
                />
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 hover:bg-[color:var(--color-surface)]'
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    onClose?.()
                  }}
                  title='Cerrar'
                  aria-label='Cerrar asistente'
                  icon={<X className='h-4 w-4' />}
                />
              </div>
            </div>

            {/* Body */}
            {!minimized && (
              <div
                className={`w-full ${mobile ? 'h-[calc(70vh-44px)]' : docked ? 'h-[calc(100%-44px)]' : 'h-[calc(480px-44px)]'}`}
              >
                <Suspense
                  fallback={
                    <div className='p-4 flex items-center justify-center'>
                      <LoadingSpinner size='md' variant='primary' label='Cargando asistente…' />
                    </div>
                  }
                >
                  <AIAssistant />
                </Suspense>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AIAssistantPanel
