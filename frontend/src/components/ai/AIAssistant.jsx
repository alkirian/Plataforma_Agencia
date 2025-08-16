// src/components/ai/AIAssistant.jsx
import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ChatInput } from './ChatInput.jsx';
import { MessageList } from './MessageList.jsx';
import { generateIdeas, getChatResponse, getChatHistory } from '../../api/ai.js';
import toast from 'react-hot-toast';

export const AIAssistant = () => {
  const { id: clientId } = useParams();
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Cargar historial inicial
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const result = await getChatHistory(clientId, { limit: 20 });
        if (ignore) return;
        const hydrated = (result.messages || []).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));
        // La API devuelve descendente; invertimos para mostrar ascendente
        setMessages(hydrated.reverse());
        setCursor(result.nextCursor || null);
        setHasMore(!!result.hasMore);
        if (hydrated.length === 0) {
          setMessages([{
            id: 'initial',
            role: 'assistant',
            content:
              'Hola! Soy tu asistente experto. Puedes hacerme preguntas sobre el cliente o pedirme que genere ideas de contenido.',
          }]);
        }
      } catch (e) {
        // No interrumpir el flujo si aún no existe la tabla
        setMessages([{
          id: 'initial',
          role: 'assistant',
          content:
            'Hola! Soy tu asistente experto. Puedes hacerme preguntas sobre el cliente o pedirme que genere ideas de contenido.',
        }]);
      }
    };
    load();
    return () => { ignore = true; };
  }, [clientId]);

  // Mutación para el chat conversacional
  const chatMutation = useMutation({
    mutationFn: ({ prompt, history }) =>
      getChatResponse(clientId, { userPrompt: prompt, chatHistory: history }),
    onSuccess: data => {
      const assistantResponse = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
      };
      setMessages(prev => [...prev, assistantResponse]);
    },
    onError: error => toast.error(`Error del asistente: ${error.message}`),
  });

  // Mutación para generar ideas
  const ideasMutation = useMutation({
    mutationFn: prompt => generateIdeas(clientId, { userPrompt: prompt }),
    onSuccess: data => {
      const ideasResponse = {
        id: `ideas-${Date.now()}`,
        role: 'assistant',
        content: '¡Claro! Aquí tienes algunas ideas de contenido basadas en el tema:',
        ideas: data,
      };
      setMessages(prev => [...prev, ideasResponse]);
    },
    onError: error => toast.error(`Error al generar ideas: ${error.message}`),
  });

  const handleSendMessage = prompt => {
    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: prompt };
    const history = messages
      .filter(m => m.id !== 'initial')
      .map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ prompt, history });
  };

  const handleLoadMore = async () => {
    if (!hasMore || !cursor) return;
    const result = await getChatHistory(clientId, { limit: 20, before: cursor });
    const hydrated = (result.messages || []).map(m => ({ id: m.id, role: m.role, content: m.content }));
    // prepend older messages (reverse to maintain ascending display)
    setMessages(prev => [...hydrated.reverse(), ...prev]);
    setCursor(result.nextCursor || null);
    setHasMore(!!result.hasMore);
  };

  const handleGenerateIdeas = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      toast.error('Por favor, escribe primero un tema en el chat para generar ideas.');
      return;
    }
    const topicMessage = {
      id: `system-${Date.now()}`,
      role: 'assistant',
      content: `Ok, generando ideas sobre: "${lastUserMessage.content}"...`,
    };
    setMessages(prev => [...prev, topicMessage]);
    ideasMutation.mutate(lastUserMessage.content);
  };

  const isLoading = chatMutation.isPending || ideasMutation.isPending;

  return (
    <div className='mt-8 p-4 bg-primary-500/5 backdrop-blur-md rounded-lg border border-primary-500/15 shadow-purple-subtle'>
      <h3 className='text-lg font-bold text-primary-400 mb-4'>Asistente de Contenido IA</h3>
      <div className='flex flex-col h-96'>
        {hasMore && (
          <button
            className='self-center mb-2 text-xs text-primary-300 hover:text-primary-200'
            onClick={handleLoadMore}
          >
            Cargar mensajes anteriores
          </button>
        )}
        <MessageList messages={messages} />
        <ChatInput
          onSendMessage={handleSendMessage}
          onGenerateIdeas={handleGenerateIdeas}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
