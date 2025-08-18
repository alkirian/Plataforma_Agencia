// src/components/ai/ChatInput.jsx
import React, { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export const ChatInput = ({ onSendMessage, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSendMessage(prompt);
    setPrompt('');
  };

  return (
    <div className="pt-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={isLoading}
          className="w-full bg-gray-900 text-gray-100 placeholder-gray-500 border border-gray-700 rounded-full py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-gray-600"
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="p-2 rounded-full bg-gray-700 text-gray-100 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Enviar"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-white/80 rounded-full animate-spin"></div>
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
