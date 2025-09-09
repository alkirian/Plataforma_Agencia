// src/components/ai/ChatInput.jsx
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

export const ChatInput = forwardRef(({ onSendMessage, isLoading }, ref) => {
  const [prompt, setPrompt] = useState('')
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      try {
        inputRef.current?.focus()
      } catch {}
    },
  }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!prompt.trim()) return
    onSendMessage(prompt)
    setPrompt('')
  }

  return (
    <div className='pt-2'>
      <form onSubmit={handleSubmit} className='flex items-center gap-2'>
        <input
          type='text'
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder='Escribe un mensaje...'
          disabled={isLoading}
          ref={inputRef}
          className='w-full bg-gray-900 text-gray-100 placeholder-gray-500 border border-gray-700 rounded-full py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-gray-600'
        />
        <button
          type='submit'
          disabled={isLoading || !prompt.trim()}
          className='p-2 rounded-full bg-gray-700 text-gray-100 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          title='Enviar'
        >
          {isLoading ? (
            <LoadingSpinner size='sm' variant='white' />
          ) : (
            <PaperAirplaneIcon className='w-5 h-5' />
          )}
        </button>
      </form>
    </div>
  )
})
