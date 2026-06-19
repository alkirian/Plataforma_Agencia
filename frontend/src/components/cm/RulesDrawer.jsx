// src/components/cm/RulesDrawer.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

export const RulesDrawer = ({
  showRulesPanel,
  setShowRulesPanel,
  integration,
  linkedinIntegration,
  tiktokIntegration,
  googleIntegration,
  handleDisconnect,
  handleLinkedInOAuth,
  handleDeleteLinkedIn,
  handleTikTokOAuth,
  handleDeleteTikTok,
  handleDeleteGoogleIntegration,
}) => {
  return (
    <AnimatePresence>
      {showRulesPanel && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRulesPanel(false)}
            className="absolute inset-0 bg-black/60 cursor-pointer"
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm h-full bg-surface/95 backdrop-blur-md border-l border-border-subtle p-6 flex flex-col gap-6 shadow-3xl overflow-y-auto z-10 text-text-primary text-left"
          >
            <div className="flex justify-between items-center border-b border-border-subtle pb-4">
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-title">
                <ShieldCheckIcon className="h-5 w-5 text-accent-cyan" />
                <span>Reglas y Canales</span>
              </h4>
              <button
                onClick={() => setShowRulesPanel(false)}
                className="btn-cyber px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer bg-surface-strong border border-border-subtle text-text-primary hover:bg-surface-soft"
              >
                Cerrar
              </button>
            </div>

            {/* Tone Card Reference */}
            <div className="bg-surface-strong/30 border border-border-subtle p-4 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-wider block select-none">Tono de Voz Activo</span>
              <p className="text-xs text-text-primary font-bold">Cálido, Cercano & Empático</p>
              <div className="text-[10px] text-text-muted leading-relaxed select-none">
                Utiliza siempre emojis amistosos, saluda de manera personalizada y mantén un lenguaje optimista y servicial.
              </div>
            </div>

            {/* Integraciones Multicanal */}
            <div className="space-y-4 border-t border-border-subtle pt-4">
              <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1 flex items-center gap-1.5 select-none">
                <LinkIcon className="h-3.5 w-3.5 text-accent-cyan" />
                <span>Integraciones Multicanal</span>
              </h5>

              <div className="space-y-3">
                {/* Facebook / Instagram Card */}
                <div className="bg-surface-strong/30 p-3 rounded-xl border border-border-subtle space-y-2.5 transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-text-primary">Facebook / Instagram</span>
                        <span className="text-[9px] text-text-muted leading-tight">Canal de auto-respuestas CM</span>
                      </div>
                    </div>
                    {integration ? (
                      <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-[8px] font-bold uppercase tracking-wider select-none">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-surface-strong border border-border-subtle text-text-muted text-[8px] font-bold uppercase tracking-wider select-none">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {integration && (
                    <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between gap-1 text-[9px]">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-text-muted font-semibold truncate max-w-[130px]">
                          Pág: {integration.page_name || 'Sin nombre'}
                        </span>
                        <span className="text-text-muted font-mono truncate max-w-[130px] opacity-75">
                          ID: {integration.page_id ? `${integration.page_id.substring(0, 6)}...` : 'N/A'}
                        </span>
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="btn-cyber px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[9px] font-bold transition-all cursor-pointer flex-shrink-0"
                      >
                        Desconectar
                      </button>
                    </div>
                  )}
                </div>

                {/* LinkedIn Card */}
                <div className="bg-surface-strong/30 p-3 rounded-xl border border-border-subtle space-y-2.5 transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-sky-500/10 text-sky-400">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-text-primary">LinkedIn Profile</span>
                        <span className="text-[9px] text-text-muted leading-tight">Publicación directa multicanal</span>
                      </div>
                    </div>
                    {linkedinIntegration ? (
                      <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-[8px] font-bold uppercase tracking-wider select-none">
                        Sincronizado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-surface-strong border border-border-subtle text-text-muted text-[8px] font-bold uppercase tracking-wider select-none">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {linkedinIntegration ? (
                    <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between gap-1 text-[9px]">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-text-muted font-semibold truncate max-w-[130px]">
                          {linkedinIntegration.linkedin_name}
                        </span>
                        <span className="text-text-muted font-mono truncate max-w-[130px] opacity-75">
                          {linkedinIntegration.linkedin_urn ? `${linkedinIntegration.linkedin_urn.substring(0, 15)}...` : 'N/A'}
                        </span>
                      </div>
                      <button
                        onClick={handleDeleteLinkedIn}
                        className="btn-cyber px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[9px] font-bold transition-all cursor-pointer flex-shrink-0"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="pt-0.5">
                      <button
                        onClick={handleLinkedInOAuth}
                        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-[9px] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 shadow-md cursor-pointer"
                      >
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        <span>Conectar LinkedIn</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* TikTok Card */}
                <div className="bg-surface-strong/30 p-3 rounded-xl border border-border-subtle space-y-2.5 transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-pink-500/10 text-pink-400">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.18-.78-2.07-1.9-2.57-3.19-.03 1.11-.02 2.22-.02 3.33v8.3c.02 1.39-.33 2.82-1.13 3.96-.8 1.16-2.05 1.99-3.46 2.3-1.45.31-3.03.11-4.37-.5-1.37-.62-2.48-1.75-3.09-3.13-.61-1.42-.64-3.07-.12-4.5.5-1.39 1.53-2.61 2.88-3.3 1.43-.72 3.12-.86 4.63-.4v4.07c-.9-.28-1.92-.19-2.73.35-.8.54-1.3 1.49-1.33 2.46.03.97.55 1.91 1.36 2.44.82.52 1.88.57 2.75.14.88-.43 1.47-1.33 1.52-2.3.01-3.12 0-6.24 0-9.36.03-3.38.01-6.76.02-10.15z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-text-primary">TikTok Business</span>
                        <span className="text-[9px] text-text-muted leading-tight">Publicación directa de videos</span>
                      </div>
                    </div>
                    {tiktokIntegration ? (
                      <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-[8px] font-bold uppercase tracking-wider select-none">
                        Sincronizado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-surface-strong border border-border-subtle text-text-muted text-[8px] font-bold uppercase tracking-wider select-none">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {tiktokIntegration ? (
                    <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between gap-1 text-[9px]">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-text-muted font-semibold truncate max-w-[130px]">
                          @{tiktokIntegration.tiktok_username}
                        </span>
                        <span className="text-text-muted font-mono truncate max-w-[130px] opacity-75">
                          {tiktokIntegration.tiktok_open_id ? `${tiktokIntegration.tiktok_open_id.substring(0, 15)}...` : 'N/A'}
                        </span>
                      </div>
                      <button
                        onClick={handleDeleteTikTok}
                        className="btn-cyber px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[9px] font-bold transition-all cursor-pointer flex-shrink-0"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="pt-0.5">
                      <button
                        onClick={handleTikTokOAuth}
                        className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-[9px] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 shadow-md cursor-pointer"
                      >
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.18-.78-2.07-1.9-2.57-3.19-.03 1.11-.02 2.22-.02 3.33v8.3c.02 1.39-.33 2.82-1.13 3.96-.8 1.16-2.05 1.99-3.46 2.3-1.45.31-3.03.11-4.37-.5-1.37-.62-2.48-1.75-3.09-3.13-.61-1.42-.64-3.07-.12-4.5.5-1.39 1.53-2.61 2.88-3.3 1.43-.72 3.12-.86 4.63-.4v4.07c-.9-.28-1.92-.19-2.73.35-.8.54-1.3 1.49-1.33 2.46.03.97.55 1.91 1.36 2.44.82.52 1.88.57 2.75.14.88-.43 1.47-1.33 1.52-2.3.01-3.12 0-6.24 0-9.36.03-3.38.01-6.76.02-10.15z" />
                        </svg>
                        <span>Conectar TikTok</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Google Ads Card */}
                <div className="bg-surface-strong/30 p-3 rounded-xl border border-border-subtle space-y-2.5 transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.772-6.19-6.184 0-3.41 2.78-6.183 6.19-6.183 1.572 0 3.011.59 4.12 1.564l3.056-3.056C19.167 1.83 16.037.93 12.24.93c-6.136 0-11.11 4.974-11.11 11.109 0 6.136 4.974 11.11 11.11 11.11 5.926 0 10.428-4.172 10.428-10.609 0-.649-.079-1.272-.189-1.854h-10.24z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-text-primary">Google Ads</span>
                        <span className="text-[9px] text-text-muted leading-tight">Auditoría y pauta en Google</span>
                      </div>
                    </div>
                    {googleIntegration ? (
                      <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-[8px] font-bold uppercase tracking-wider select-none">
                        Sincronizado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-surface-strong border border-border-subtle text-text-muted text-[8px] font-bold uppercase tracking-wider select-none">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {googleIntegration ? (
                    <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between gap-1 text-[9px]">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-text-muted font-semibold truncate max-w-[130px]">
                          {googleIntegration.google_account_name || 'Google Ads'}
                        </span>
                        <span className="text-text-muted font-mono truncate max-w-[130px] opacity-75">
                          ID: {googleIntegration.google_customer_id}
                        </span>
                      </div>
                      <button
                        onClick={handleDeleteGoogleIntegration}
                        className="btn-cyber px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[9px] font-bold transition-all cursor-pointer flex-shrink-0"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="pt-0.5">
                      <span className="text-[9px] text-text-muted block italic">
                        Vincula Google Ads desde la pestaña de Publicidad
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Guidelines info */}
            <div className="bg-surface-strong/30 border border-border-subtle p-4 rounded-xl flex items-start gap-2.5 mt-auto">
              <ShieldCheckIcon className="h-4.5 w-4.5 text-accent-cyan flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-text-muted leading-relaxed">
                <span className="font-bold text-text-secondary">Seguridad RAG:</span> El CM Inteligente está restringido a responder únicamente en base a los documentos cargados en tu sección "Documentos". Nunca inventará links o datos que no estén explícitamente verificados.
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
