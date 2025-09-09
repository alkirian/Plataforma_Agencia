// IdeaCardEditor.jsx - Editor component for idea content
import React from 'react'

const IdeaCardEditor = ({ draft, onDraftChange }) => {
  const updateDraft = (field, value) => {
    onDraftChange(d => ({ ...d, [field]: value }))
  }

  return (
    <div className='mt-3 grid gap-2'>
      <IdeaTitleInput value={draft.title} onChange={value => updateDraft('title', value)} />

      <IdeaCopyInput value={draft.copy} onChange={value => updateDraft('copy', value)} />

      <IdeaHashtagsInput
        value={draft.hashtags}
        onChange={value => updateDraft('hashtags', value)}
      />

      <IdeaCTAInput
        value={draft.call_to_action}
        onChange={value => updateDraft('call_to_action', value)}
      />

      <IdeaMediaInputs
        mediaType={draft.media_type}
        mediaDescription={draft.media_description}
        onMediaTypeChange={value => updateDraft('media_type', value)}
        onMediaDescriptionChange={value => updateDraft('media_description', value)}
      />

      <IdeaPlatformsInput
        value={draft.platforms}
        onChange={value => updateDraft('platforms', value)}
      />
    </div>
  )
}

const IdeaTitleInput = ({ value, onChange }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
    placeholder='Título de la idea'
  />
)

const IdeaCopyInput = ({ value, onChange }) => (
  <textarea
    rows={4}
    value={value}
    onChange={e => onChange(e.target.value)}
    className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
    placeholder='Contenido del post'
  />
)

const IdeaHashtagsInput = ({ value, onChange }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder='hashtags separados por coma'
    className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
  />
)

const IdeaCTAInput = ({ value, onChange }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder='CTA'
    className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
  />
)

const IdeaMediaInputs = ({
  mediaType,
  mediaDescription,
  onMediaTypeChange,
  onMediaDescriptionChange,
}) => (
  <div className='grid grid-cols-2 gap-2'>
    <input
      value={mediaType}
      onChange={e => onMediaTypeChange(e.target.value)}
      placeholder='media type'
      className='rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
    />
    <input
      value={mediaDescription}
      onChange={e => onMediaDescriptionChange(e.target.value)}
      placeholder='media description'
      className='rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
    />
  </div>
)

const IdeaPlatformsInput = ({ value, onChange }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder='plataformas separadas por coma'
    className='w-full rounded-md bg-surface-soft border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-white/30 focus:ring-1 focus:ring-white/20'
  />
)

export default IdeaCardEditor
