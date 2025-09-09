// IdeaCardLikes.jsx - Like/dislike buttons for ideas
import React from 'react'

const IdeaCardLikes = ({ liked, onLikeToggle }) => {
  return (
    <div className='flex items-center gap-2'>
      <LikeButton isActive={liked === true} onClick={() => onLikeToggle(true)} />
      <DislikeButton isActive={liked === false} onClick={() => onLikeToggle(false)} />
    </div>
  )
}

const LikeButton = ({ isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-md border ${
      isActive ? 'border-blue-500 text-blue-400' : 'border-white/10 text-text-muted'
    } hover:text-blue-300`}
    title='Me gusta'
  >
    <ThumbsUpIcon />
  </button>
)

const DislikeButton = ({ isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-md border ${
      isActive ? 'border-red-500 text-red-400' : 'border-white/10 text-text-muted'
    } hover:text-red-300`}
    title='No me gusta'
  >
    <ThumbsDownIcon />
  </button>
)

const ThumbsUpIcon = () => (
  <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M2 21h4V9H2v12zm20-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1.5 1.5 0 00-.44-1.06L13 1 7.59 6.41A2 2 0 007 7.83V19a2 2 0 002 2h7c.82 0 1.54-.5 1.84-1.25l3.02-7.05c.09-.23.14-.47.14-.72v-2z' />
  </svg>
)

const ThumbsDownIcon = () => (
  <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M22 3h-4v12h4V3zM2 10c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .39.16.77.44 1.06L11 23l5.41-5.41c.38-.38.59-.9.59-1.42V5a2 2 0 00-2-2H7C6.18 3 5.46 3.5 5.16 4.25L2.14 11.3c-.09.23-.14.47-.14.7V10z' />
  </svg>
)

export default IdeaCardLikes
