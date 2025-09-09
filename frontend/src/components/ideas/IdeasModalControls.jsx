// IdeasModalControls.jsx - Control panel for Ideas Modal
import React from 'react'

const TONE_PRESETS = [
  'Profesional',
  'Simpático',
  'Inspirador',
  'Informativo',
  'Humor ligero',
  'Empático',
  'Premium',
  'Directo y claro',
]

const COUNT_PRESETS = [3, 5, 10]

const IdeasModalControls = ({
  tone,
  setTone,
  userPrompt,
  setUserPrompt,
  count,
  setCount,
  customCount,
  setCustomCount,
  preferWeekdays,
  setPreferWeekdays,
  effectiveCount,
}) => {
  return (
    <div className='space-y-4'>
      <ToneSelector tone={tone} onToneChange={setTone} />
      <PromptInput userPrompt={userPrompt} onPromptChange={setUserPrompt} />
      <CountSelector
        count={count}
        setCount={setCount}
        customCount={customCount}
        setCustomCount={setCustomCount}
        effectiveCount={effectiveCount}
      />
      <WeekdaysPreference preferWeekdays={preferWeekdays} onPreferenceChange={setPreferWeekdays} />
    </div>
  )
}

const ToneSelector = ({ tone, onToneChange }) => (
  <div>
    <label className='block text-sm text-text-muted mb-2'>Tono</label>
    <div className='flex flex-wrap gap-2'>
      {TONE_PRESETS.map(t => (
        <button
          key={t}
          onClick={() => onToneChange(t)}
          className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
            tone === t
              ? 'border-blue-500 text-text-primary bg-blue-500/10'
              : 'border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  </div>
)

const PromptInput = ({ userPrompt, onPromptChange }) => (
  <div>
    <label className='block text-sm text-text-muted mb-2'>Prompt (opcional)</label>
    <textarea
      rows={3}
      value={userPrompt}
      onChange={e => onPromptChange(e.target.value)}
      className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-white/30 focus:ring-1 focus:ring-white/20'
      placeholder='Ej: enfocar en lanzamientos del producto X y tutoriales cortos'
    />
  </div>
)

const CountSelector = ({ count, setCount, customCount, setCustomCount, effectiveCount }) => (
  <div>
    <label className='block text-sm text-text-muted mb-2'>Cantidad de ideas</label>
    <div className='flex items-center gap-2'>
      {COUNT_PRESETS.map(n => (
        <button
          key={n}
          onClick={() => {
            setCount(n)
            setCustomCount('')
          }}
          className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
            effectiveCount === n && !customCount
              ? 'border-blue-500 text-text-primary bg-blue-500/10'
              : 'border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'
          }`}
        >
          {n}
        </button>
      ))}
      <input
        type='number'
        min={1}
        max={15}
        value={customCount}
        onChange={e => setCustomCount(e.target.value)}
        placeholder='Custom'
        className='w-24 rounded-md bg-surface-soft border border-white/10 px-2 py-1 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
      />
    </div>
  </div>
)

const WeekdaysPreference = ({ preferWeekdays, onPreferenceChange }) => (
  <div className='flex items-center gap-2'>
    <input
      id='preferWeekdays'
      type='checkbox'
      checked={preferWeekdays}
      onChange={e => onPreferenceChange(e.target.checked)}
      className='rounded border-white/10 text-blue-500 focus:ring-blue-500/20'
    />
    <label htmlFor='preferWeekdays' className='text-sm text-text-muted'>
      Preferir días hábiles
    </label>
  </div>
)

export default IdeasModalControls
