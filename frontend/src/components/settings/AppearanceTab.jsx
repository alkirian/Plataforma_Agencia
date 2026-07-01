import React from 'react';
import { PaintBrushIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export const AppearanceTab = ({ theme, handleThemeChange, t }) => {
  return (
    <Card className='surface'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg text-text-primary'>
          <PaintBrushIcon className='h-5 w-5' />
          {t.appearance.title}
        </CardTitle>
        <p className='text-xs text-text-muted mt-1'>{t.appearance.desc}</p>
      </CardHeader>
      <CardContent className='space-y-4 pt-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {/* Modo Oscuro */}
          <button
            type='button'
            onClick={(e) => handleThemeChange('dark', e)}
            className={`flex flex-col text-left p-5 rounded-2xl border transition duration-200 ${
              theme === 'dark'
                ? 'bg-surface border-border-strong ring-1 ring-border-strong shadow-md'
                : 'border-border-subtle bg-surface-soft/40 hover:bg-surface-soft hover:border-border-strong'
            }`}
          >
            <div className='flex items-center justify-between w-full'>
              <span className='font-bold text-sm text-text-primary'>
                {t.appearance.darkTitle}
              </span>
              {theme === 'dark' && (
                <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider'>
                  <CheckIcon className='h-3 w-3' />
                  {t.appearance.active}
                </span>
              )}
            </div>
            <p className='text-xs text-text-muted mt-2 leading-relaxed'>
              {t.appearance.darkDesc}
            </p>
            <div className='mt-4 w-full h-16 rounded-lg bg-[#161517] border border-border-subtle flex p-2 gap-2'>
              <div className='w-1/4 h-full bg-[#1C1A1E] rounded border border-border-subtle'></div>
              <div className='w-3/4 h-full bg-[#222024] rounded border border-border-subtle flex flex-col gap-1 p-1'>
                <div className='w-1/2 h-2 bg-text-muted/20 rounded'></div>
                <div className='w-full h-2 bg-text-muted/10 rounded'></div>
              </div>
            </div>
          </button>

          {/* Modo Claro */}
          <button
            type='button'
            onClick={(e) => handleThemeChange('light', e)}
            className={`flex flex-col text-left p-5 rounded-2xl border transition duration-200 ${
              theme === 'light'
                ? 'bg-surface border-border-strong ring-1 ring-border-strong shadow-md'
                : 'border-border-subtle bg-surface-soft/40 hover:bg-surface-soft hover:border-border-strong'
            }`}
          >
            <div className='flex items-center justify-between w-full'>
              <span className='font-bold text-sm text-text-primary'>
                {t.appearance.lightTitle}
              </span>
              {theme === 'light' && (
                <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider'>
                  <CheckIcon className='h-3 w-3' />
                  {t.appearance.active}
                </span>
              )}
            </div>
            <p className='text-xs text-text-muted mt-2 leading-relaxed'>
              {t.appearance.lightDesc}
            </p>
            <div className='mt-4 w-full h-16 rounded-lg bg-[#F8FAFC] border border-border-subtle flex p-2 gap-2'>
              <div className='w-1/4 h-full bg-[#F1F5F9] rounded border border-border-subtle'></div>
              <div className='w-3/4 h-full bg-[#FFFFFF] rounded border border-border-subtle flex flex-col gap-1 p-1'>
                <div className='w-1/2 h-2 bg-text-muted/30 rounded'></div>
                <div className='w-full h-2 bg-text-muted/10 rounded'></div>
              </div>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
