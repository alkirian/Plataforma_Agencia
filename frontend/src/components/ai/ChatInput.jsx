// src/components/ai/ChatInput.jsx
import React, { useState } from 'react';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/solid';

export const ChatInput = ({ onSendMessage, onGenerateIdeas, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSendMessage(prompt);
    setPrompt('');
  };

  return (
    <div className='pt-2 border-t border-slate-700'>
      <form onSubmit={handleSubmit} className='flex items-center space-x-2'>
        <input
          type='text'
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder='Hola, ¿en qué te puedo ayudar?'
          disabled={isLoading}
          className='w-full bg-slate-900/50 text-white placeholder-gray-500 border border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500'
        />
        <button
          type='submit'
          disabled={isLoading}
          className='text-white p-2 rounded-md disabled:opacity-50'
        >
          {isLoading ? (
            <div className='w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin'></div>
          ) : (
            <PaperAirplaneIcon className='w-5 h-5' />
          )}
        </button>
      </form>
      <div className='flex justify-end mt-2'>
        <button
          onClick={onGenerateIdeas}
          disabled={isLoading}
          className='flex items-center space-x-2 text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-4 py-2 rounded-md disabled:opacity-50 transition-all'
        >
          <SparklesIcon className='w-4 h-4' />
          <span>Generar Ideas</span>
        </button>
      </div>
    </div>
  );
};
