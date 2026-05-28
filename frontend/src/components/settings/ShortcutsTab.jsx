import React from 'react';
import { CommandLineIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export const ShortcutsTab = ({ setIsKeyboardModalOpen, t, lang }) => {
  return (
    <Card className='surface'>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <CardTitle className='flex items-center gap-2 text-lg text-text-primary'>
            <CommandLineIcon className='h-5 w-5' />
            {t.shortcuts.title}
          </CardTitle>
          <p className='text-xs text-text-muted mt-1'>{t.shortcuts.desc}</p>
        </div>
        <button
          type='button'
          onClick={() => setIsKeyboardModalOpen(true)}
          className='px-3.5 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-strong text-xs font-bold text-text-primary transition self-start sm:self-auto'
        >
          {lang === 'es' ? 'Modal Completo' : 'View Keyboard Modal'}
        </button>
      </CardHeader>
      <CardContent className='pt-4 space-y-4'>
        <div className='rounded-xl border border-border-subtle bg-surface-soft/40 overflow-hidden'>
          <table className='w-full text-left text-sm'>
            <thead className='bg-surface-strong border-b border-border-subtle text-xs font-bold uppercase tracking-wider text-text-muted'>
              <tr>
                <th className='px-4 py-3'>{t.shortcuts.action}</th>
                <th className='px-4 py-3'>{t.shortcuts.key}</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border-subtle font-medium text-text-primary'>
              {t.shortcuts.list.map((shortcut, i) => (
                <tr key={i} className='hover:bg-surface transition'>
                  <td className='px-4 py-3.5'>{shortcut.action}</td>
                  <td className='px-4 py-3.5'>
                    <kbd className='px-2 py-1.5 text-xs font-semibold font-mono rounded-lg bg-surface border border-border-strong text-text-muted shadow-sm uppercase tracking-wide'>
                      {shortcut.key}
                    </kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
