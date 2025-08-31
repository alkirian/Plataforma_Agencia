import React, { useMemo, useState, useEffect, useRef } from 'react';

// Simple, dependency-free search over events
export const SearchBar = ({ events = [], onSelect }) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const boxRef = useRef(null);

  // Normalize string
  const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const nq = norm(q);
    const scored = events
      .map((e) => {
        const title = e.title || '';
        const desc = e.extendedProps?.description || '';
        const channel = e.extendedProps?.channel || '';
        const haystack = `${title} ${desc} ${channel}`;
        const text = norm(haystack);
        const idx = text.indexOf(nq);
        if (idx === -1) return null;
        return { e, score: idx, title };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8);
    return scored.map((s) => s.e);
  }, [q, events]);

  useEffect(() => {
    const onDoc = (ev) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  const handleSelect = (id) => {
    if (typeof onSelect === 'function') onSelect(id);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) handleSelect(item.id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <input
        type="text"
        placeholder="Buscar posteo..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="w-48 md:w-60 rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-[color:var(--color-border-strong)]"
      />
      {open && q && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-[color:var(--color-border-subtle)] bg-surface-strong shadow-xl">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-text-muted">Sin resultados</div>
          ) : (
            results.map((ev, idx) => {
              const d = ev.start ? new Date(ev.start) : null;
              const hh = d ? String(d.getHours()).padStart(2, '0') : '--';
              const mm = d ? String(d.getMinutes()).padStart(2, '0') : '--';
              const dd = d ? String(d.getDate()).padStart(2, '0') : '--';
              const mo = d ? String(d.getMonth() + 1).padStart(2, '0') : '--';
              return (
                <button
                  key={ev.id}
                  onClick={() => handleSelect(ev.id)}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-surface-soft ${idx === activeIndex ? 'bg-surface-soft' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-text-primary">{ev.title}</span>
                    <span className="shrink-0 text-[10px] text-text-muted">{dd}/{mo} {hh}:{mm}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

