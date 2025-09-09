// IdeasMinimizedBar.jsx - Minimized floating bar for Ideas Modal
import React from 'react'

const IdeasMinimizedBar = ({ loading, ideasCount, onRestore }) => {
  return (
    <div className='fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-surface-900/90 backdrop-blur-xl shadow-2xl'>
      <div className='text-sm text-text-muted'>
        {loading ? 'Generando ideas…' : `${ideasCount} ideas listas`}
      </div>

      {loading && <ProgressBar />}

      <button
        onClick={onRestore}
        className='px-2 py-1 text-xs rounded-md border border-white/10 text-text-primary hover:bg-white/10'
      >
        Restaurar
      </button>

      <ProgressBarStyles />
    </div>
  )
}

const ProgressBar = () => (
  <div className='w-32 h-1.5 bg-surface-soft rounded-full overflow-hidden'>
    <div className='h-full w-1/3 bg-gradient-to-r from-blue-500 to-blue-300 animate-[progress_1.2s_linear_infinite]' />
  </div>
)

const ProgressBarStyles = () => (
  <style>
    {`@keyframes progress { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }`}
  </style>
)

export default IdeasMinimizedBar
