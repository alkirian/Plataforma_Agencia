import React, { useState } from 'react';

export const IdeaCard = ({ idea, onAddToCalendar }) => {
  const [liked, setLiked] = useState(null); // true | false | null
  const [date, setDate] = useState(() => idea.scheduled_at || '');

  const handleLike = (val) => {
    setLiked((prev) => (prev === val ? null : val));
    // TODO: enviar feedback al backend cuando exista endpoint/persistencia
  };

  const handleAdd = () => {
    if (!date) return;
    onAddToCalendar({ ...idea, scheduled_at: date });
  };

  return (
    <div className="p-4 rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-text-primary">{idea.title}</h4>
          {idea.media?.type && (
            <p className="text-xs text-text-muted mt-1">Propuesta audiovisual: <span className="text-text-primary">{idea.media.type}</span>{idea.media?.description ? ` — ${idea.media.description}` : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLike(true)}
            className={`p-2 rounded-md border ${liked === true ? 'border-green-500 text-green-400' : 'border-[color:var(--color-border-subtle)] text-text-muted'} hover:text-green-300`}
            title="Me gusta"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 10a4 4 0 014-4h2.586a1 1 0 00.707-.293l1.414-1.414A2 2 0 0114.414 3H15a3 3 0 013 3v2a3 3 0 01-3 3h-3.586l-3.707 3.707A1 1 0 016 14V9a1 1 0 00-1-1H3z"/>
            </svg>
          </button>
          <button
            onClick={() => handleLike(false)}
            className={`p-2 rounded-md border ${liked === false ? 'border-red-500 text-red-400' : 'border-[color:var(--color-border-subtle)] text-text-muted'} hover:text-red-300`}
            title="No me gusta"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17 10a4 4 0 00-4-4h-2.586a1 1 0 01-.707-.293L7.586 4.293A2 2 0 005.586 3H5a3 3 0 00-3 3v2a3 3 0 003 3h3.586l3.707 3.707A1 1 0 0014 14V9a1 1 0 011-1h2z"/>
            </svg>
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm whitespace-pre-wrap text-text-secondary">{idea.copy}</p>
      {Array.isArray(idea.hashtags) && idea.hashtags.length > 0 && (
        <div className="mt-2 text-xs text-text-muted">
          {idea.hashtags.map((h, idx) => (
            <span key={idx} className="mr-2">{h}</span>
          ))}
        </div>
      )}
      {idea.call_to_action && (
        <p className="mt-2 text-sm text-text-primary">CTA: <span className="text-text-secondary">{idea.call_to_action}</span></p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Fecha sugerida</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md bg-surface-strong border border-[color:var(--color-border-subtle)] px-2 py-1 text-sm text-text-primary"
          />
        </div>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-text-primary"
        >
          Agregar al calendario
        </button>
      </div>
    </div>
  );
};

