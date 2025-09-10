import React, { Suspense, lazy, useEffect, useRef, useState, MouseEvent, PointerEvent } from 'react'
import { motion, AnimatePresence, useDragControls, DragControls } from 'framer-motion'
import { Minus, X, PanelRightOpen, PanelLeftOpen } from 'lucide-react'
import { Button } from '@components/ui'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

// Lazy load AIAssistant component
const AIAssistant = lazy(() => import('./AIAssistant.jsx' as any).then((m: any) => ({ default: m.AIAssistant })))

// Types
export interface AIAssistantPanelProps {
  open: boolean
  minimized: boolean
  onMinimize?: () => void
  onClose?: () => void
}

interface Position {
  top: number
  left: number
}

interface Edges {
  top: number
  bottom: number
}

type DockedSide = 'left' | 'right'
type PanelMode = 'docked' | 'float'

// Utility functions
const isMobile = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches

const safeJSONParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeLocalStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Silent fail
  }
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ 
  open, 
  minimized, 
  onMinimize, 
  onClose 
}) => {
  const [pos, setPos] = useState<Position>({ top: 0, left: 0 })
  const [dockedSide, setDockedSide] = useState<DockedSide>('right')
  const [docked, setDocked] = useState<boolean>(false)
  const [edges, setEdges] = useState<Edges>({ top: 8, bottom: 8 })
  const panelRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  const openedOnceRef = useRef<boolean>(false)

  // Initialize panel state from localStorage
  useEffect(() => {
    const dock = safeLocalStorageGet('ai:panel:dock')
    const mode = safeLocalStorageGet('ai:panel:mode')
    const rawPos = safeLocalStorageGet('ai:panel:pos')

    // Set default preferences if not found
    if (!dock) safeLocalStorageSet('ai:panel:dock', 'right')
    if (!mode) safeLocalStorageSet('ai:panel:mode', 'docked')

    // Apply state from storage or defaults
    if (dock === 'left' || dock === 'right') {
      setDockedSide(dock)
    } else {
      setDockedSide('right')
    }
    
    if (mode === 'docked' || !mode) {
      setDocked(true)
    }

    if (rawPos) {
      const parsedPos = safeJSONParse<Position>(rawPos, { top: 0, left: 0 })
      if (typeof parsedPos.top === 'number' && typeof parsedPos.left === 'number') {
        setPos(parsedPos)
      }
    } else {
      // Default bottom-right position (only applies in floating mode)
      const vw = window.innerWidth
      const vh = window.innerHeight
      setPos({ top: Math.max(8, vh - 520), left: Math.max(8, vw - 400) })
    }
  }, [])

  // Force dock to right on first open if not docked
  useEffect(() => {
    if (!open) return
    if (openedOnceRef.current) return
    
    openedOnceRef.current = true
    
    const storedMode = safeLocalStorageGet('ai:panel:mode')
    const storedDock = safeLocalStorageGet('ai:panel:dock')
    
    if (storedMode !== 'docked') {
      setDockedSide('right')
      setDocked(true)
      safeLocalStorageSet('ai:panel:mode', 'docked')
      safeLocalStorageSet('ai:panel:dock', 'right')
    } else if (storedDock !== 'left' && storedDock !== 'right') {
      setDockedSide('right')
      safeLocalStorageSet('ai:panel:dock', 'right')
    }
  }, [open])

  // Handle window resize and viewport changes
  useEffect(() => {
    const onResize = (): void => {
      const vh = window.innerHeight
      const headerEl = document.querySelector('.header-cyber') as HTMLElement
      const footerEl = document.querySelector('footer') as HTMLElement
      const headerH = headerEl?.offsetHeight || 64
      const footerH = footerEl?.offsetHeight || 0
      
      setEdges({ top: headerH + 8, bottom: footerH + 8 })
      
      // Clamp position inside viewport
      const vw = window.innerWidth
      let panelWidth = 380
      
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        if (rect?.width) panelWidth = rect.width
      }
      
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

  // Persist state changes to localStorage
  useEffect(() => {
    safeLocalStorageSet('ai:panel:pos', JSON.stringify(pos))
  }, [pos])
  
  useEffect(() => {
    safeLocalStorageSet('ai:panel:dock', dockedSide)
  }, [dockedSide])
  
  useEffect(() => {
    safeLocalStorageSet('ai:panel:mode', docked ? 'docked' : 'float')
  }, [docked])

  // Handle ESC key and outside clicks
  useEffect(() => {
    if (!open) return
    
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose?.()
    }
    
    const onClick = (e: globalThis.MouseEvent): void => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target as Node)) onClose?.()
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
    
    if (docked) {
      body.dataset.aiDock = dockedSide
      body.style.setProperty('--ai-dock-width', 'clamp(320px, 28vw, 420px)')
    } else {
      delete body.dataset.aiDock
    }
    
    return () => {}
  }, [docked, dockedSide])

  const snapToEdge = (): void => {
    const vw = window.innerWidth
    let panelWidth = 380
    
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect()
      if (rect?.width) panelWidth = rect.width
    }
    
    const margin = 8
    setPos(p => ({
      ...p,
      left: p.left < vw / 2 ? margin : Math.max(margin, vw - panelWidth - margin),
    }))
  }

  const handleDockLeft = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation()
    setDockedSide('left')
    setDocked(true)
    safeLocalStorageSet('ai:panel:mode', 'docked')
    safeLocalStorageSet('ai:panel:dock', 'left')
  }

  const handleDockRight = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation()
    setDockedSide('right')
    setDocked(true)
    safeLocalStorageSet('ai:panel:mode', 'docked')
    safeLocalStorageSet('ai:panel:dock', 'right')
  }

  const handleMinimize = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation()
    onMinimize?.()
  }

  const handleClose = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation()
    onClose?.()
  }

  const handleHeaderPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    if (isMobile()) return
    
    if (docked) {
      // Capture current screen position to avoid jump when undocking
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        setPos({ top: rect.top, left: rect.left })
      }
      // Undock and start drag on next frame
      setDocked(false)
      requestAnimationFrame(() => dragControls.start(e))
    } else {
      dragControls.start(e)
    }
  }

  const handleDragStart = (): void => {
    if (docked && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect()
      setPos({ top: rect.top, left: rect.left })
      setDocked(false)
    }
  }

  if (!open) return null

  const mobile = isMobile()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key='ai-panel'
          ref={panelRef}
          className='fixed z-[70]'
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
            className={`rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)] shadow-2xl overflow-hidden ${
              mobile 
                ? (minimized ? 'h-[44px] mx-3' : 'h-[70vh] mx-3') 
                : docked 
                  ? (minimized ? 'h-[44px]' : 'h-full') 
                  : minimized 
                    ? 'h-[44px]' 
                    : 'h-[480px]'
            }`}
            drag={!mobile && !docked}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={docked ? { x: 0, y: 0 } : undefined}
            animate={docked ? { x: 0, y: 0 } : undefined}
            onDragStart={handleDragStart}
            onDragEnd={snapToEdge}
          >
            {/* Header grip */}
            <div
              className='flex items-center justify-between px-3 py-2 border-b border-[color:var(--color-border-subtle)] cursor-move select-none'
              onPointerDown={handleHeaderPointerDown}
            >
              <div className='text-sm font-medium'>Asistente IA</div>
              <div className='flex items-center gap-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2 hover:bg-[color:var(--color-surface)]'
                  onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()}
                  onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                  onClick={handleDockLeft}
                  title='Anclar a la izquierda'
                  aria-label='Anclar a la izquierda'
                  icon={<PanelLeftOpen className='h-4 w-4' />}
                />
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2 hover:bg-[color:var(--color-surface)]'
                  onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()}
                  onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                  onClick={handleDockRight}
                  title='Anclar a la derecha'
                  aria-label='Anclar a la derecha'
                  icon={<PanelRightOpen className='h-4 w-4' />}
                />
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 hover:bg-[color:var(--color-surface)]'
                  onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()}
                  onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                  onClick={handleMinimize}
                  title={minimized ? 'Restaurar' : 'Minimizar'}
                  aria-label={minimized ? 'Restaurar asistente' : 'Minimizar asistente'}
                  icon={<Minus className='h-4 w-4' />}
                />
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 hover:bg-[color:var(--color-surface)]'
                  onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()}
                  onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                  onClick={handleClose}
                  title='Cerrar'
                  aria-label='Cerrar asistente'
                  icon={<X className='h-4 w-4' />}
                />
              </div>
            </div>

            {/* Body */}
            {!minimized && (
              <div
                className={`w-full ${
                  mobile 
                    ? 'h-[calc(70vh-44px)]' 
                    : docked 
                      ? 'h-[calc(100%-44px)]' 
                      : 'h-[calc(480px-44px)]'
                }`}
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
