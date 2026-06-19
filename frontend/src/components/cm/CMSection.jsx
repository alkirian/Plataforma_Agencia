// src/components/cm/CMSection.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMSection } from './useCMSection';
import { InboxSubTab } from './InboxSubTab';
import { PromotePostSubTab } from './PromotePostSubTab';
import { RulesDrawer } from './RulesDrawer';
import { MetaAdsSection } from '../meta/MetaAdsSection';
import { GoogleAdsSection } from '../google/GoogleAdsSection';
import {
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export const CMSection = ({ clientId }) => {
  const {
    loading,
    integration,
    connecting,
    activeSubTab,
    setActiveSubTab,
    activeNetwork,
    setActiveNetwork,
    showRulesPanel,
    setShowRulesPanel,
    // Google Ads integration
    googleIntegration,
    handleDeleteGoogleIntegration,
    // Meta OAuth
    connectingOAuth,
    oauthStep,
    setOauthStep,
    adAccountsList,
    pagesList,
    selectedAccountId,
    setSelectedAccountId,
    selectedPageId,
    setSelectedPageId,
    handleFacebookOAuth,
    // Other channels
    linkedinIntegration,
    tiktokIntegration,
    connectingLI,
    connectingTK,
    handleLinkedInOAuth,
    handleDeleteLinkedIn,
    handleTikTokOAuth,
    handleDeleteTikTok,
    // Meta actions
    handleConfirmOnboarding,
    handleDisconnect,
  } = useCMSection(clientId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-text-muted">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-bold tracking-widest uppercase">
          Verificando integración de Meta...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full text-text-primary">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4 text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary font-title">
              Centro de CM & Publicidad
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Gestión orgánica con IA y auditoría de pauta publicitaria
            </p>
          </div>

          {/* Sub-tab Selector Switcher */}
          <div className="flex items-center gap-1 bg-surface-soft/80 p-1 rounded-xl border border-border-subtle self-start md:self-auto select-none">
            <button
              onClick={() => setActiveSubTab('inbox')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeSubTab === 'inbox'
                  ? 'bg-surface text-accent-cyan border border-border-subtle shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>Bandeja e Interacciones</span>
            </button>
            <button
              onClick={() => setActiveSubTab('posts')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeSubTab === 'posts'
                  ? 'bg-surface text-emerald-400 border border-border-subtle shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              <span>Promocionar Publicación</span>
            </button>
            <button
              onClick={() => setActiveSubTab('ads')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeSubTab === 'ads'
                  ? 'bg-surface text-purple-400 border border-border-subtle shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <ChartBarIcon className="h-4 w-4" />
              <span>Publicidad y Métricas</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowRulesPanel(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-text-secondary bg-surface-soft hover:bg-surface border border-border-subtle rounded-xl transition-all cursor-pointer shadow-xs self-end sm:self-auto shrink-0"
        >
          <Cog6ToothIcon className="h-4 w-4 text-accent-cyan" />
          <span>Reglas y Canales</span>
        </button>
      </div>

      {/* MAIN WORKSPACE CONTAINER */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'inbox' ? (
          <motion.div
            key="inbox-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <InboxSubTab
              clientId={clientId}
              integration={integration}
              oauthStep={oauthStep}
              setOauthStep={setOauthStep}
              connectingOAuth={connectingOAuth}
              handleFacebookOAuth={handleFacebookOAuth}
              adAccountsList={adAccountsList}
              pagesList={pagesList}
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              selectedPageId={selectedPageId}
              setSelectedPageId={setSelectedPageId}
              connecting={connecting}
              handleConfirmOnboarding={handleConfirmOnboarding}
            />
          </motion.div>
        ) : activeSubTab === 'posts' ? (
          <motion.div
            key="posts-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <PromotePostSubTab
              clientId={clientId}
              integration={integration}
            />
          </motion.div>
        ) : (
          <motion.div
            key="ads-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col gap-6 text-left"
          >
            {/* Sub-network switcher */}
            <div className="flex items-center gap-1 bg-surface-soft/80 p-1 rounded-xl border border-border-subtle self-start select-none">
              <button
                onClick={() => setActiveNetwork('meta')}
                className={`flex items-center gap-1.5 px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeNetwork === 'meta'
                    ? 'bg-surface text-purple-400 border border-border-subtle shadow-md'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span>Meta Ads</span>
              </button>
              <button
                onClick={() => setActiveNetwork('google')}
                className={`flex items-center gap-1.5 px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeNetwork === 'google'
                    ? 'bg-surface text-blue-400 border border-border-subtle shadow-md'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span>Google Ads</span>
              </button>
            </div>

            {activeNetwork === 'meta' ? (
              <MetaAdsSection clientId={clientId} isEmbedded={true} />
            ) : (
              <GoogleAdsSection clientId={clientId} isEmbedded={true} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliding Rules & Autopilot Drawer */}
      <RulesDrawer
        showRulesPanel={showRulesPanel}
        setShowRulesPanel={setShowRulesPanel}
        integration={integration}
        linkedinIntegration={linkedinIntegration}
        tiktokIntegration={tiktokIntegration}
        googleIntegration={googleIntegration}
        handleDisconnect={handleDisconnect}
        handleLinkedInOAuth={handleLinkedInOAuth}
        handleDeleteLinkedIn={handleDeleteLinkedIn}
        handleTikTokOAuth={handleTikTokOAuth}
        handleDeleteTikTok={handleDeleteTikTok}
        handleDeleteGoogleIntegration={handleDeleteGoogleIntegration}
      />
    </div>
  );
};
