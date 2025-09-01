import React, { useEffect, useMemo, useState } from 'react';
import { AIAssistantLauncher } from './AIAssistantLauncher.jsx';
import { AIAssistantPanel } from './AIAssistantPanel.jsx';

export const AIAssistantDock = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai:panel:open');
      if (saved === '1') setOpen(true);
      const min = localStorage.getItem('ai:panel:min');
      if (min === '1') setMinimized(true);
    } catch (_) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('ai:panel:open', open ? '1' : '0'); } catch(_) {}
  }, [open]);
  useEffect(() => {
    try { localStorage.setItem('ai:panel:min', minimized ? '1' : '0'); } catch(_) {}
  }, [minimized]);

  const toggle = () => setOpen(v => !v);

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
  );
};

export default AIAssistantDock;

