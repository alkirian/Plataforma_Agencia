// src/components/ai/MessageList.jsx
import React from 'react';

export const MessageList = ({ messages }) => {
  return (
    <div className="space-y-3">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
              msg.role === 'user'
                ? 'bg-gray-700 text-gray-100 rounded-br-md'
                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-md'
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
