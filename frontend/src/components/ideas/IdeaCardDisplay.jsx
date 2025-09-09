// IdeaCardDisplay.jsx - Display component for idea content
import React from 'react'

const IdeaCardDisplay = ({ idea }) => {
  return (
    <>
      <p className='mt-3 text-sm whitespace-pre-wrap text-text-secondary'>{idea.copy}</p>

      <IdeaHashtags hashtags={idea.hashtags} />

      <IdeaCallToAction callToAction={idea.call_to_action} />
    </>
  )
}

const IdeaHashtags = ({ hashtags }) => {
  if (!Array.isArray(hashtags) || hashtags.length === 0) {
    return null
  }

  return (
    <div className='mt-2 text-xs text-text-muted'>
      {hashtags.map((h, idx) => (
        <span key={idx} className='mr-2'>
          {h}
        </span>
      ))}
    </div>
  )
}

const IdeaCallToAction = ({ callToAction }) => {
  if (!callToAction) {
    return null
  }

  return (
    <p className='mt-2 text-sm text-text-primary'>
      CTA: <span className='text-text-secondary'>{callToAction}</span>
    </p>
  )
}

export default IdeaCardDisplay
