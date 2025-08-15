// src/components/ai/AIAssistant.jsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ChatInput } from './ChatInput.jsx';
import { MessageList } from './MessageList.jsx';
import { generateIdeas } from '../../services/ai.js';
import toast from 'react-hot-toast';

export const AIAssistant = () => {
  const { id: clientId } = useParams();
  const [messages, setMessages] = useState([
    { id: 'initial', role: 'assistant', content: 'Hola! Soy tu asistente. ¿Sobre qué tema necesitas ideas de contenido hoy?' }
  ]);

  const mutation = useMutation({
    mutationFn: (prompt) => generateIdeas(clientId, { userPrompt: prompt }),
    onSuccess: (data) => {
      const assistantResponse = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Aquí tienes algunas ideas basadas en tus documentos:',
        ideas: data,
      };
      setMessages((prev) => [...prev, assistantResponse]);
    },
    onError: (error) => {
      toast.error(`Error de la IA: ${error.message}`);
    },
  });

  const handleSendMessage = (prompt) => {
    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    mutation.mutate(prompt);
  };

  return (
    <div className="mt-8 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
      <h3 className="text-lg font-bold text-cyan-300 mb-4">Asistente de Contenido IA</h3>
      <div className="flex flex-col h-96">
        <MessageList messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={mutation.isPending} />
      </div>
    </div>
  );
};
