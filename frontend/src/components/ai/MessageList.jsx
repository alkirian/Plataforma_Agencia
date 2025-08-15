// src/components/ai/MessageList.jsx
import React from 'react';

export const MessageList = ({ messages }) => {
  return (
    <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-md p-3 rounded-lg shadow ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-200'}`}>
            <p>{msg.content}</p>
            {msg.ideas && Array.isArray(msg.ideas) && (
              <ul className="mt-2 space-y-2 list-disc list-inside">
                {msg.ideas.map((idea, index) => (
                  <li key={index} className="p-2 bg-slate-800/50 rounded">
                    <strong>{idea.title}</strong> - <span className="text-xs text-cyan-400">{idea.scheduled_at}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
