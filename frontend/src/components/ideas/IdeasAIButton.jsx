import React from 'react';

export const IdeasAIButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-surface-soft text-sm text-text-primary hover:border-[color:var(--color-border-strong)] hover:bg-surface-strong transition-colors"
    title="Generar ideas con IA"
  >
    <span className="inline-flex items-center gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Generar ideas IA
    </span>
  </button>
);

