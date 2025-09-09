import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Lightbulb } from 'lucide-react'
import { Modal } from '@components/ui/Modal'
import { generateIdeas, sendIdeaFeedback } from '@api/ai'
import { createScheduleItem } from '@schedule'

// Extracted components for better maintainability
import IdeasModalControls from './IdeasModalControls.jsx'
import IdeasMinimizedBar from './IdeasMinimizedBar.jsx'
import IdeaCardDisplay from './IdeaCardDisplay.jsx'
import IdeaCardEditor from './IdeaCardEditor.jsx'
import IdeaCardLikes from './IdeaCardLikes.jsx'

export const IdeasModal = ({
  isOpen,
  onClose,
  clientId,
  defaultPlatforms = ['IG', 'TikTok'],
  onCreateEvent,
}) => {
  const [tone, setTone] = useState('Profesional')
  const [userPrompt, setUserPrompt] = useState('')
  const [count, setCount] = useState(10)
  const [customCount, setCustomCount] = useState('')
  const [preferWeekdays, setPreferWeekdays] = useState(true)
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)

  // Recordar últimos valores por cliente (simple localStorage)
  useEffect(() => {
    if (!clientId) return
    const key = `ai-ideas-prefs:${clientId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const p = JSON.parse(saved)
        if (p.tone) setTone(p.tone)
        if (typeof p.count === 'number') setCount(p.count)
        if (typeof p.preferWeekdays === 'boolean') setPreferWeekdays(p.preferWeekdays)
      } catch {}
    }
  }, [clientId])

  useEffect(() => {
    if (!clientId) return
    const key = `ai-ideas-prefs:${clientId}`
    const data = { tone, count, preferWeekdays }
    localStorage.setItem(key, JSON.stringify(data))
  }, [clientId, tone, count, preferWeekdays])

  const effectiveCount = useMemo(() => {
    const n = Number(customCount)
    if (customCount && !Number.isNaN(n)) return Math.max(1, Math.min(15, n))
    return count
  }, [count, customCount])

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setIdeas([])
      setMinimized(false)
      const payload = {
        tone,
        userPrompt: userPrompt || '',
        count: effectiveCount,
        preferWeekdays: !!preferWeekdays,
        platforms: defaultPlatforms,
      }
      const data = await generateIdeas(clientId, payload)
      setIdeas(Array.isArray(data) ? data : Array.isArray(data?.ideas) ? data.ideas : [])
    } catch (e) {
      toast.error(e.message || 'Error al generar ideas')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCalendar = async idea => {
    try {
      const iso = idea.scheduled_at ? `${idea.scheduled_at}T12:00:00.000Z` : undefined
      const payload = {
        title: idea.title,
        copy: [
          idea.copy,
          (idea.hashtags || [])
            .map(h => h?.trim())
            .filter(Boolean)
            .join(' '),
          idea.call_to_action,
        ]
          .filter(Boolean)
          .join('\n\n'),
        scheduled_at: iso,
        status: 'pendiente',
        channel: (idea.platforms && idea.platforms[0]) || 'IG',
      }
      if (typeof onCreateEvent === 'function') {
        await onCreateEvent(payload)
      } else {
        await createScheduleItem(clientId, payload)
      }
      toast.success('Agregado al calendario')
    } catch (e) {
      toast.error(e.message || 'No se pudo agregar')
    }
  }

  const actions = [
    {
      id: 'close',
      label: 'Cerrar',
      variant: 'ghost',
    },
    {
      id: 'generate',
      label: loading ? 'Generando…' : 'Generar',
      variant: 'primary',
      onClick: handleGenerate,
      disabled: loading,
      loading,
    },
  ]

  const secondaryActions = [
    {
      id: 'minimize',
      label: 'Minimizar',
      variant: 'ghost',
      onClick: () => setMinimized(true),
    },
  ]

  return (
    <>
      {/* Floating minimized bar */}
      {isOpen && minimized && (
        <div className='fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-surface-900/90 backdrop-blur-xl shadow-2xl'>
          <div className='text-sm text-text-muted'>
            {loading ? 'Generando ideas…' : `${ideas.length} ideas listas`}
          </div>
          {loading && (
            <div className='w-32 h-1.5 bg-surface-soft rounded-full overflow-hidden'>
              <div className='h-full w-1/3 bg-gradient-to-r from-blue-500 to-blue-300 animate-[progress_1.2s_linear_infinite]' />
            </div>
          )}
          <button
            onClick={() => setMinimized(false)}
            className='px-2 py-1 text-xs rounded-md border border-white/10 text-text-primary hover:bg-white/10'
          >
            Restaurar
          </button>
          <style>{`@keyframes progress { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }`}</style>
        </div>
      )}

      <Modal
        open={isOpen && !minimized}
        onClose={onClose}
        title='Generar ideas con IA'
        size='xl'
        icon={<Lightbulb className='h-6 w-6 text-primary-400' />}
        actions={actions}
        secondaryActions={secondaryActions}
        footer={
          loading && (
            <div className='w-full h-1.5 bg-surface-soft rounded-full overflow-hidden'>
              <div className='h-full w-1/3 bg-gradient-to-r from-blue-500 to-blue-300 animate-[progress_1.2s_linear_infinite]' />
            </div>
          )
        }
      >
        {/* Controles */}
        <div className='space-y-4'>
          {/* Tono */}
          <div>
            <label className='block text-sm text-text-muted mb-2'>Tono</label>
            <div className='flex flex-wrap gap-2'>
              {TONE_PRESETS.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${tone === t ? 'border-blue-500 text-text-primary bg-blue-500/10' : 'border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt libre */}
          <div>
            <label className='block text-sm text-text-muted mb-2'>Prompt (opcional)</label>
            <textarea
              rows={3}
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-white/30 focus:ring-1 focus:ring-white/20'
              placeholder='Ej: enfocar en lanzamientos del producto X y tutoriales cortos'
            />
          </div>

          {/* Cantidad */}
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
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${effectiveCount === n && !customCount ? 'border-blue-500 text-text-primary bg-blue-500/10' : 'border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'}`}
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

          {/* Preferir días hábiles */}
          <div className='flex items-center gap-2'>
            <input
              id='preferWeekdays'
              type='checkbox'
              checked={preferWeekdays}
              onChange={e => setPreferWeekdays(e.target.checked)}
              className='rounded border-white/10 text-blue-500 focus:ring-blue-500/20'
            />
            <label htmlFor='preferWeekdays' className='text-sm text-text-muted'>
              Preferir días hábiles
            </label>
          </div>
        </div>

        {/* Resultados */}
        {ideas.length > 0 && (
          <div className='mt-6 grid gap-3'>
            {ideas.map((idea, idx) => (
              <IdeaCard
                key={idea.id || idx}
                idea={idea}
                clientId={clientId}
                onAddToCalendar={handleAddToCalendar}
              />
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}

const IdeaCard = ({ idea, clientId, onAddToCalendar }) => {
  const [liked, setLiked] = useState(null)
  const [date, setDate] = useState(() => idea.scheduled_at || '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => ({
    title: idea.title || '',
    copy: idea.copy || '',
    hashtags: Array.isArray(idea.hashtags) ? idea.hashtags.join(', ') : '',
    call_to_action: idea.call_to_action || '',
    media_type: idea.media?.type || '',
    media_description: idea.media?.description || '',
    platforms: Array.isArray(idea.platforms) ? idea.platforms.join(',') : '',
  }))

  const handleAdd = () => {
    if (!date) return
    onAddToCalendar({ ...idea, scheduled_at: date })
  }

  return (
    <div className='p-4 rounded-lg border border-white/10 bg-surface-soft'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h4 className='font-semibold text-text-primary'>{idea.title}</h4>
          {idea.media?.type && (
            <p className='text-xs text-text-muted mt-1'>
              Propuesta audiovisual: <span className='text-text-primary'>{idea.media.type}</span>
              {idea.media?.description ? ` — ${idea.media.description}` : ''}
            </p>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => handleLikeToggle(true)}
            className={`p-2 rounded-md border ${liked === true ? 'border-blue-500 text-blue-400' : 'border-white/10 text-text-muted'} hover:text-blue-300`}
            title='Me gusta'
          >
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M2 21h4V9H2v12zm20-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1.5 1.5 0 00-.44-1.06L13 1 7.59 6.41A2 2 0 007 7.83V19a2 2 0 002 2h7c.82 0 1.54-.5 1.84-1.25l3.02-7.05c.09-.23.14-.47.14-.72v-2z' />
            </svg>
          </button>
          <button
            onClick={() => handleLikeToggle(false)}
            className={`p-2 rounded-md border ${liked === false ? 'border-red-500 text-red-400' : 'border-white/10 text-text-muted'} hover:text-red-300`}
            title='No me gusta'
          >
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M22 3h-4v12h4V3zM2 10c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .39.16.77.44 1.06L11 23l5.41-5.41c.38-.38.59-.9.59-1.42V5a2 2 0 00-2-2H7C6.18 3 5.46 3.5 5.16 4.25L2.14 11.3c-.09.23-.14.47-.14.7V10z' />
            </svg>
          </button>
        </div>
      </div>

      {!editing ? (
        <>
          <p className='mt-3 text-sm whitespace-pre-wrap text-text-secondary'>{idea.copy}</p>
          {Array.isArray(idea.hashtags) && idea.hashtags.length > 0 && (
            <div className='mt-2 text-xs text-text-muted'>
              {idea.hashtags.map((h, idx) => (
                <span key={idx} className='mr-2'>
                  {h}
                </span>
              ))}
            </div>
          )}
          {idea.call_to_action && (
            <p className='mt-2 text-sm text-text-primary'>
              CTA: <span className='text-text-secondary'>{idea.call_to_action}</span>
            </p>
          )}
        </>
      ) : (
        <div className='mt-3 grid gap-2'>
          <input
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
          />
          <textarea
            rows={4}
            value={draft.copy}
            onChange={e => setDraft(d => ({ ...d, copy: e.target.value }))}
            className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
          />
          <input
            value={draft.hashtags}
            onChange={e => setDraft(d => ({ ...d, hashtags: e.target.value }))}
            placeholder='hashtags separados por coma'
            className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
          />
          <input
            value={draft.call_to_action}
            onChange={e => setDraft(d => ({ ...d, call_to_action: e.target.value }))}
            placeholder='CTA'
            className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
          />
          <div className='grid grid-cols-2 gap-2'>
            <input
              value={draft.media_type}
              onChange={e => setDraft(d => ({ ...d, media_type: e.target.value }))}
              placeholder='media type'
              className='rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
            />
            <input
              value={draft.media_description}
              onChange={e => setDraft(d => ({ ...d, media_description: e.target.value }))}
              placeholder='media description'
              className='rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
            />
          </div>
          <input
            value={draft.platforms}
            onChange={e => setDraft(d => ({ ...d, platforms: e.target.value }))}
            placeholder='plataformas separadas por coma'
            className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
          />
        </div>
      )}

      <div className='mt-3 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <label className='text-xs text-text-muted'>Fecha sugerida</label>
          <input
            type='date'
            value={date}
            onChange={e => setDate(e.target.value)}
            className='rounded-md bg-surface-soft border border-white/10 px-2 py-1 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
          />
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setEditing(e => !e)}
            className='px-3 py-1.5 rounded-md text-sm border border-white/10 text-text-primary hover:bg-white/10'
          >
            {editing ? 'Listo' : 'Editar'}
          </button>
          <button
            onClick={() => {
              const updated = editing
                ? {
                    ...idea,
                    title: draft.title,
                    copy: draft.copy,
                    hashtags: draft.hashtags
                      .split(',')
                      .map(h => h.trim())
                      .filter(Boolean),
                    call_to_action: draft.call_to_action,
                    media: { type: draft.media_type, description: draft.media_description },
                    platforms: draft.platforms
                      .split(',')
                      .map(p => p.trim())
                      .filter(Boolean),
                  }
                : idea
              onAddToCalendar({ ...updated, scheduled_at: date })
            }}
            className='px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-text-primary'
          >
            Agregar al calendario
          </button>
        </div>
      </div>
    </div>
  )
}
const handleLikeToggle = async next => {
  const current = liked
  const newState = current === next ? null : next
  setLiked(newState)
  // send feedback only if we have a persisted id
  if (idea.id) {
    try {
      const value = newState === true ? 'like' : newState === false ? 'dislike' : 'clear'
      await sendIdeaFeedback(clientId, idea.id, value)
    } catch (e) {
      // revert on error
      setLiked(current)
    }
  }
}
