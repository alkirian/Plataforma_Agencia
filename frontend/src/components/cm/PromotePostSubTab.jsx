// src/components/cm/PromotePostSubTab.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../api/apiFetch';
import {
  ArrowPathIcon,
  MegaphoneIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export const PromotePostSubTab = ({ clientId, integration }) => {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState('');
  
  // Boost form states
  const [boostCampaignName, setBoostCampaignName] = useState('');
  const [boostTotalBudget, setBoostTotalBudget] = useState(15);
  const [boostDurationDays, setBoostDurationDays] = useState(3);
  const [boostingPostId, setBoostingPostId] = useState('');

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await apiFetch(`/clients/${clientId}/meta-integration/posts`);
      if (res?.data) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar las publicaciones orgánicas.');
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (integration) {
      fetchPosts();
    }
  }, [integration, clientId]);

  const handleExpandPost = (post) => {
    if (expandedPostId === post.id) {
      setExpandedPostId('');
    } else {
      setExpandedPostId(post.id);
      setBoostCampaignName(
        `Promoción: ${post.caption ? post.caption.substring(0, 30) : 'Post sin texto'} (${new Date().toLocaleDateString()})`
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
      toast.success('¡Campaña de promoción creada y lanzada con éxito!');
      setExpandedPostId('');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al lanzar la promoción en Meta Ads.');
    } finally {
      setBoostingPostId('');
    }
  };

  if (!integration) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-surface border border-border-subtle rounded-2xl flex flex-col items-center gap-4 shadow-sm mt-12">
        <MegaphoneIcon className="h-10 w-10 text-emerald-400" />
        <h3 className="text-base font-bold text-text-primary">Conecta Meta para continuar</h3>
        <p className="text-xs text-text-muted leading-relaxed">
          Para ver tus publicaciones orgánicas y promocionarlas en Meta Ads, primero debes conectar tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
      <div className="bg-surface border border-border-subtle rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-text-primary font-title">
            Publicaciones Orgánicas
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Selecciona una publicación activa en tus redes para promocionarla directamente en Meta Ads
          </p>
        </div>
        <button
          onClick={fetchPosts}
          disabled={loadingPosts}
          className="btn-cyber p-2 flex items-center justify-center cursor-pointer"
          title="Actualizar publicaciones"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loadingPosts ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loadingPosts ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface border border-border-subtle rounded-2xl h-64">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-emerald-400 mb-2" />
          <p className="text-xs font-semibold tracking-wider uppercase text-text-muted/65">
            Cargando publicaciones...
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
                        {new Date(post.createdAt).toLocaleDateString('es-ES', {
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
                      Ver en red social ↗
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
                    {post.caption || <span className="italic text-text-muted">Sin texto</span>}
                  </div>

                  {/* Estadísticas de engagement */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50 mt-1">
                    <div className="flex items-center gap-4 text-[10px] text-text-muted font-bold">
                      <span>👍 {post.likesCount || 0} Likes</span>
                      <span>💬 {post.commentsCount || 0} Comentarios</span>
                      <span>🔄 {post.sharesCount || 0} Compartidos</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpandPost(post);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all duration-150 cursor-pointer shadow-md"
                    >
                      <MegaphoneIcon className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Cancelar' : 'Promocionar'}</span>
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
                            <h4 className="text-xs font-bold text-text-primary font-title">Configurar Campaña de Promoción</h4>
                            <p className="text-[10px] text-text-muted mt-0.5">
                              Se creará automáticamente una campaña de tráfico en tu cuenta de Meta Ads usando este post como anuncio.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                              Nombre de la Campaña
                            </label>
                            <input
                              type="text"
                              value={boostCampaignName}
                              onChange={e => setBoostCampaignName(e.target.value)}
                              placeholder="Nombre de la campaña..."
                              className="w-full bg-surface border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                Presupuesto Total (USD)
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
                                Duración (Días)
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
                            Inversión diaria estimada: <strong className="text-text-primary">${boostDurationDays > 0 ? (boostTotalBudget / boostDurationDays).toFixed(2) : '0.00'} USD/día</strong>
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedPostId('')}
                              className="text-xs font-bold text-text-muted hover:text-text-primary px-3 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              Cancelar
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
                              <span>Confirmar y Lanzar</span>
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
          <p className="text-xs font-medium text-text-muted">No se encontraron publicaciones orgánicas activas.</p>
        </div>
      )}
    </div>
  );
};
