import React from 'react';
import { LanguageIcon, CheckIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export const LanguageTab = ({ lang, handleLangChange, t }) => {
  return (
    <Card className='surface'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg text-text-primary'>
          <LanguageIcon className='h-5 w-5' />
          {t.language.title}
        </CardTitle>
        <p className='text-xs text-text-muted mt-1'>{t.language.desc}</p>
      </CardHeader>
      <CardContent className='space-y-4 pt-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {/* Español */}
          <button
            type='button'
            onClick={() => handleLangChange('es')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition ${
              lang === 'es'
                ? 'bg-surface border-border-strong ring-1 ring-border-strong shadow-sm'
                : 'border-border-subtle bg-surface-soft/40 hover:bg-surface-soft hover:border-border-strong'
            }`}
          >
            <div className='flex flex-col text-left'>
              <span className='font-bold text-sm text-text-primary'>
                {t.language.esLabel}
              </span>
              <span className='text-[10px] text-text-muted mt-0.5'>
                Spanish translation active
              </span>
            </div>
            {lang === 'es' ? (
              <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider'>
                <CheckIcon className='h-3.5 w-3.5' />
                {t.language.active}
              </span>
            ) : (
              <span className='text-xs font-semibold text-text-muted hover:text-text-primary flex items-center gap-1'>
                {t.language.select} <ChevronRightIcon className='h-3 w-3' />
              </span>
            )}
          </button>

          {/* Inglés */}
          <button
            type='button'
            onClick={() => handleLangChange('en')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition ${
              lang === 'en'
                ? 'bg-surface border-border-strong ring-1 ring-border-strong shadow-sm'
                : 'border-border-subtle bg-surface-soft/40 hover:bg-surface-soft hover:border-border-strong'
            }`}
          >
            <div className='flex flex-col text-left'>
              <span className='font-bold text-sm text-text-primary'>
                {t.language.enLabel}
              </span>
              <span className='text-[10px] text-text-muted mt-0.5'>
                English translation active
              </span>
            </div>
            {lang === 'en' ? (
              <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider'>
                <CheckIcon className='h-3.5 w-3.5' />
                {t.language.active}
              </span>
            ) : (
              <span className='text-xs font-semibold text-text-muted flex items-center gap-1'>
                {t.language.select} <ChevronRightIcon className='h-3 w-3' />
              </span>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
