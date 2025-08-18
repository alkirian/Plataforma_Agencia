// src/components/ai/AIAssistant.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ChatInput } from './ChatInput.jsx';
import { MessageList } from './MessageList.jsx';
import { getChatResponse, getChatHistory } from '../../api/ai.js';
export const AIAssistant = () => {
  const { id: clientId } = useParams();
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef(null);
  const atBottomRef = useRef(true);

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
        setMessages(hydrated.reverse());
        setCursor(result.nextCursor || null);
        setHasMore(!!result.hasMore);
        if (hydrated.length === 0) {
          setMessages([{
            id: 'initial',
            role: 'assistant',
            content: '¡Hola! Soy tu asistente de marketing digital. Estoy aquí para ayudarte con estrategias de contenido, análisis de audiencia y optimización de campañas.',
          }]);
        }
      } catch (e) {
        setMessages([{
          id: 'initial',
          role: 'assistant',
          content: '¡Hola! Soy tu asistente de marketing digital. Estoy aquí para ayudarte con estrategias de contenido, análisis de audiencia y optimización de campañas.',
        }]);
      }
    };
    load();
    return () => { ignore = true; };
  }, [clientId]);

  // Auto-scroll cuando llegan mensajes nuevos
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (atBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

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
    const container = scrollRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    try {
      const result = await getChatHistory(clientId, { limit: 20, before: cursor });
      const hydrated = (result.messages || []).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content
      }));
      setMessages(prev => [...hydrated.reverse(), ...prev]);
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight + container.scrollTop;
        }
      });
      setCursor(result.nextCursor || null);
      setHasMore(!!result.hasMore);
    } catch (error) {
      toast.error('Error al cargar mensajes anteriores');
    }
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const threshold = 24;
    atBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const isLoading = chatMutation.isPending;

  return (
    <div className="flex flex-col max-h-[780px] h-full bg-[#1a1a1a] rounded-lg overflow-hidden">
      {/* Header minimalista */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#262626] border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-200">Asistente IA</h3>
            <p className="text-[10px] text-gray-500">
              {isLoading ? 'escribiendo...' : 'activo'}
            </p>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent min-h-0" 
        ref={scrollRef} 
        onScroll={handleScroll}
      >
        {/* Botón cargar más */}
        {hasMore && (
          <div className="sticky top-0 z-10 px-3 py-2 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-gray-800/30">
            <button
              className="w-full text-[11px] text-gray-500 hover:text-gray-400 py-1.5 rounded transition-colors"
              onClick={handleLoadMore}
            >
              Cargar mensajes anteriores
            </button>
          </div>
        )}
        {/* Lista de mensajes */}
        <div className="px-3 py-3 space-y-3">
          <MessageList messages={messages} />
          {/* Indicador de escritura */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-2xl bg-[#262626]">
                <div className="flex items-center gap-1">
                  <span className="block w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                  <span className="block w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="block w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input siempre visible */}
      <div className="sticky bottom-0 px-3 py-2 bg-[#262626] border-t border-gray-800/50">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
