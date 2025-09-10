import React, { useEffect, useMemo, useState } from 'react'
import { AIAssistantLauncher } from './AIAssistantLauncher.jsx'
import { AIAssistantPanel } from './AIAssistantPanel.tsx'

export const AIAssistantDock = () => {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai:panel:open')
      if (saved === '1') setOpen(true)
      const min = localStorage.getItem('ai:panel:min')
      if (min === '1') setMinimized(true)
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('ai:panel:open', open ? '1' : '0')
    } catch (_) {}
  }, [open])
  useEffect(() => {
    try {
      localStorage.setItem('ai:panel:min', minimized ? '1' : '0')
    } catch (_) {}
  }, [minimized])

  const toggle = () => setOpen(v => !v)

  // Atajos globales: Alt+A (abrir/cerrar), Ctrl+L (focus input)
  useEffect(() => {
    const onKey = e => {
      try {
        const key = e.key?.toLowerCase?.()
        // Abrir/cerrar con Alt+A
        if (e.altKey && key === 'a') {
          e.preventDefault()
          setOpen(v => !v)
          return
        }
        // Enfocar input con Ctrl+L cuando está abierto
        if (open && (e.ctrlKey || e.metaKey) && key === 'l') {
          e.preventDefault()
          window.dispatchEvent(new Event('ai:focus-input'))
          return
        }
      } catch (_) {}
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <AIAssistantLauncher open={open} onToggle={toggle} />
      <AIAssistantPanel
        open={open}
        minimized={minimized}
        onMinimize={() => setMinimized(v => !v)}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

export default AIAssistantDock
