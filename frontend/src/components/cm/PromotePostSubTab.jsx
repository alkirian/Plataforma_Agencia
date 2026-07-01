// src/components/cm/PromotePostSubTab.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../hooks';
import { apiFetch } from '../../api/apiFetch';
import { cmCache } from './cmCache';
import {
  ArrowPathIcon,
  MegaphoneIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export const PromotePostSubTab = ({ clientId, integration }) => {
  const { t, lang } = useLanguage();
  const cachedPosts = cmCache.get(clientId).posts;
  const [posts, setPosts] = useState(cachedPosts || []);
  const [loadingPosts, setLoadingPosts] = useState(!cachedPosts);
  const [expandedPostId, setExpandedPostId] = useState('');
  
  // Boost form states
  const [boostCampaignName, setBoostCampaignName] = useState('');
  const [boostTotalBudget, setBoostTotalBudget] = useState(15);
  const [boostDurationDays, setBoostDurationDays] = useState(3);
  const [boostingPostId, setBoostingPostId] = useState('');

  const fetchPosts = async () => {
    const cached = cmCache.get(clientId).posts;
    if (cached) {
      setPosts(cached);
      setLoadingPosts(false);
    } else {
      setLoadingPosts(true);
    }
    try {
      const res = await apiFetch(`/clients/${clientId}/meta-integration/posts`);
      if (res?.data) {
        setPosts(res.data);
        cmCache.setPosts(clientId, res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.cm.loadPostsError);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (integration) {
      fetchPosts();
    }
  }, [integration, clientId]);

  // Sincronizar posts con caché
  useEffect(() => {
    if (posts && posts.length > 0) {
      cmCache.setPosts(clientId, posts);
    }
  }, [posts, clientId]);

  const handleExpandPost = (post) => {
    if (expandedPostId === post.id) {
      setExpandedPostId('');
    } else {
      setExpandedPostId(post.id);
      setBoostCampaignName(
        t.cm.promoteTitle
          .replace('{text}', post.caption ? post.caption.substring(0, 30) : t.cm.postNoText)
          .replace('{date}', new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'))
      );
    }
  };

  const handleBoostSubmit = async (post) => {
    setBoostingPostId(post.id);
    try {
      await apiFetch(`/clients/${clientId}/meta-integration/posts/boost`, {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          campaignName: boostCampaignName,
          totalBudget: boostTotalBudget,
          durationDays: boostDurationDays,
          platform: post.platform,
        }),
      });
      toast.success(t.cm.promoteSuccess);
      setExpandedPostId('');
    } catch (err) {
      console.error(err);
      toast.error(err.message || t.cm.promoteError);
    } finally {
      setBoostingPostId('');
    }
  };

  if (!integration) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-surface border border-border-subtle rounded-2xl flex flex-col items-center gap-4 shadow-sm mt-12">
        <MegaphoneIcon className="h-10 w-10 text-emerald-400" />
        <h3 className="text-base font-bold text-text-primary">{t.cm.connectMetaToContinue}</h3>
        <p className="text-xs text-text-muted leading-relaxed">
          {t.cm.connectMetaDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
      <div className="bg-surface border border-border-subtle rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-text-primary font-title">
            {t.cm.organicPostsTitle}
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            {t.cm.organicPostsDesc}
          </p>
        </div>
        <button
          onClick={fetchPosts}
          disabled={loadingPosts}
          className="btn-cyber p-2 flex items-center justify-center cursor-pointer"
          title={t.cm.refreshPosts}
        >
          <ArrowPathIcon className={`h-4 w-4 ${loadingPosts ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loadingPosts ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface border border-border-subtle rounded-2xl h-64">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-emerald-400 mb-2" />
          <p className="text-xs font-semibold tracking-wider uppercase text-text-muted/65">
            {t.cm.loadingPosts}
          </p>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-5">
          {posts.map(post => {
            const isExpanded = expandedPostId === post.id;
            return (
              <motion.div
                key={post.id}
                layout="position"
                className={`bg-surface border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isExpanded
                    ? 'border-emerald-500/40 shadow-md ring-1 ring-emerald-500/10'
                    : 'border-border-subtle hover:border-border-muted shadow-xs'
                }`}
              >
                {/* Cabecera del Post */}
                <div 
                  onClick={() => handleExpandPost(post)}
                  className="p-5 flex flex-col gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-text-secondary bg-surface-soft border border-border-subtle px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {post.platform}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(post.createdAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[10px] text-accent-blue hover:underline font-bold"
                    >
                      {t.cm.viewOnSocial}
                    </a>
                  </div>

                  {/* Imagen si existe */}
                  {post.imageUrl && (
                    <div className="w-full max-h-80 overflow-hidden rounded-xl border border-border-subtle bg-black/10 flex items-center justify-center">
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full h-full object-cover max-h-80"
                      />
                    </div>
                  )}

                  {/* Texto/Caption */}
                  <div className="text-xs text-text-secondary leading-relaxed font-medium pl-0.5 whitespace-pre-wrap select-text">
                    {post.caption || <span className="italic text-text-muted">{t.cm.postNoText}</span>}
                  </div>

                  {/* Estadísticas de engagement */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50 mt-1">
                    <div className="flex items-center gap-4 text-[10px] text-text-muted font-bold">
                      <span>👍 {post.likesCount || 0} {t.cm.likes}</span>
                      <span>💬 {post.commentsCount || 0} {t.cm.comments}</span>
                      <span>🔄 {post.sharesCount || 0} {t.cm.shares}</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpandPost(post);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer shadow-md"
                    >
                      <MegaphoneIcon className="w-3.5 h-3.5" />
                      <span>{isExpanded ? t.cm.cancelBtn : t.cm.promoteBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Formulario de Promoción (Boost) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border-subtle bg-emerald-950/5 overflow-hidden"
                    >
                      <div className="p-5 flex flex-col gap-4 border-l-2 border-emerald-500">
                        <div className="flex items-start gap-2.5">
                          <MegaphoneIcon className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-text-primary font-title">{t.cm.configureBoostTitle}</h4>
                            <p className="text-[10px] text-text-muted mt-0.5">
                              {t.cm.configureBoostDesc}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                              {t.cm.campaignNameLabel}
                            </label>
                            <input
                              type="text"
                              value={boostCampaignName}
                              onChange={e => setBoostCampaignName(e.target.value)}
                              placeholder={t.cm.campaignNamePlaceholder}
                              className="w-full bg-surface border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                {t.cm.budgetLabel}
                              </label>
                              <input
                                type="number"
                                value={boostTotalBudget}
                                min={5}
                                max={1000}
                                onChange={e => setBoostTotalBudget(parseFloat(e.target.value) || 0)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                {t.cm.durationLabel}
                              </label>
                              <input
                                type="number"
                                value={boostDurationDays}
                                min={1}
                                max={30}
                                onChange={e => setBoostDurationDays(parseInt(e.target.value, 10) || 0)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50 mt-1">
                          <span className="text-[10px] text-text-muted font-medium">
                            {t.cm.dailyInvestmentEst}<strong className="text-text-primary">${boostDurationDays > 0 ? (boostTotalBudget / boostDurationDays).toFixed(2) : '0.00'} {t.cm.usdPerDay}</strong>
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedPostId('')}
                              className="text-xs font-bold text-text-muted hover:text-text-primary px-3 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              {t.cm.cancelBtn}
                            </button>
                            <button
                              onClick={() => handleBoostSubmit(post)}
                              disabled={boostingPostId === post.id || boostTotalBudget < 5 || boostDurationDays < 1}
                              className="flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {boostingPostId === post.id ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckIcon className="h-4 w-4" />
                              )}
                              <span>{t.cm.confirmAndLaunch}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface border border-border-subtle rounded-2xl h-64">
          <p className="text-xs font-medium text-text-muted">{t.cm.noPosts}</p>
        </div>
      )}
    </div>
  );
};
