import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, X, PanelRightOpen, PanelLeftOpen } from 'lucide-react';

const AIAssistant = lazy(() => import('./AIAssistant.jsx').then(m => ({ default: m.AIAssistant })));

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

export const AIAssistantPanel = ({ open, minimized, onMinimize, onClose }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [dockedSide, setDockedSide] = useState('right'); // 'left' | 'right'
  const [docked, setDocked] = useState(false);
  const [edges, setEdges] = useState({ top: 8, bottom: 8 });
  const panelRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai:panel:pos');
      const dock = localStorage.getItem('ai:panel:dock');
      const mode = localStorage.getItem('ai:panel:mode');
      if (dock === 'left' || dock === 'right') setDockedSide(dock);
      if (mode === 'docked') setDocked(true);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.top === 'number' && typeof p.left === 'number') setPos(p);
      } else {
        // default bottom-right
        const vw = window.innerWidth; const vh = window.innerHeight;
        setPos({ top: Math.max(8, vh - 520), left: Math.max(8, vw - 400) });
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const onResize = () => {
      const vh = window.innerHeight;
      const headerEl = document.querySelector('.header-cyber');
      const footerEl = document.querySelector('footer');
      const headerH = headerEl?.offsetHeight || 64;
      const footerH = footerEl?.offsetHeight || 0;
      setEdges({ top: headerH + 8, bottom: footerH + 8 });
      // Clamp position inside viewport
      const vw = window.innerWidth;
      setPos(p => ({ top: Math.max(8, Math.min(vh - 120, p.top)), left: Math.max(8, Math.min(vw - 380, p.left)) }));
    };
    if (typeof window !== 'undefined') {
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    return () => {};
  }, []);

  useEffect(() => {
    try { localStorage.setItem('ai:panel:pos', JSON.stringify(pos)); } catch (_) {}
  }, [pos]);
  useEffect(() => {
    try { localStorage.setItem('ai:panel:dock', dockedSide); } catch (_) {}
  }, [dockedSide]);
  useEffect(() => {
    try { localStorage.setItem('ai:panel:mode', docked ? 'docked' : 'float'); } catch (_) {}
  }, [docked]);

  // Update body dataset to push layout when docked
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    try {
      if (docked) {
        body.dataset.aiDock = dockedSide;
        body.style.setProperty('--ai-dock-width', '380px');
      } else {
        delete body.dataset.aiDock;
      }
    } catch (_) {}
    return () => {};
  }, [docked, dockedSide]);

  const snapToEdge = () => {
    const vw = window.innerWidth;
    setPos(p => ({ ...p, left: p.left < vw / 2 ? 8 : Math.max(8, vw - 388) }));
  };

  if (!open) return null;

  const mobile = isMobile();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="ai-panel"
          ref={panelRef}
          className={`fixed z-[70]`}
          style={mobile
            ? { left: 0, right: 0, bottom: 0 }
            : docked
              ? (dockedSide === 'right'
                  ? { right: 8, top: edges.top, bottom: edges.bottom, width: 380 }
                  : { left: 8, top: edges.top, bottom: edges.bottom, width: 380 })
              : { top: pos.top, left: pos.left, width: 380 }
          }
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className={`rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-strong)] shadow-2xl overflow-hidden ${mobile ? 'h-[70vh] mx-3' : docked ? 'h-full' : 'h-[480px]'}`}
            drag={!mobile && !minimized && !docked}
            dragMomentum={false}
            onDragStart={() => { if (docked) setDocked(false); }}
            onDragEnd={snapToEdge}
          >
            {/* Header grip */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[color:var(--color-border-subtle)] cursor-move select-none">
              <div className="text-sm font-medium">Asistente IA</div>
              <div className="flex items-center gap-1">
                <button
                  className="h-8 px-2 rounded-md hover:bg-[color:var(--color-surface)]"
                  onClick={() => { setDockedSide('left'); setDocked(true); }}
                  title="Anclar a la izquierda"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
                <button
                  className="h-8 px-2 rounded-md hover:bg-[color:var(--color-surface)]"
                  onClick={() => { setDockedSide('right'); setDocked(true); }}
                  title="Anclar a la derecha"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-md hover:bg-[color:var(--color-surface)]" onClick={onMinimize} title={minimized ? 'Restaurar' : 'Minimizar'}>
                  <Minus className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 rounded-md hover:bg-[color:var(--color-surface)]" onClick={onClose} title="Cerrar">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!minimized && (
              <div className={`w-full ${mobile ? 'h-[calc(70vh-44px)]' : docked ? 'h-[calc(100%-44px)]' : 'h-[calc(480px-44px)]'}`}>
                <Suspense fallback={<div className="p-4 text-sm">Cargando asistente…</div>}>
                  <AIAssistant />
                </Suspense>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantPanel;
