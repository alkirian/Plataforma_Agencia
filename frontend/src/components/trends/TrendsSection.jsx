// src/components/trends/TrendsSection.jsx
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  BoltIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { runTrendsForClient, getTrendReports } from '../../api/trends.js';
import { useLanguage } from '../../hooks';

// Shared modular refactored components
import { groupReportsByDate } from './trendsHelpers.js';

// Lazy loading de componentes pesados de reportes
const CreateEventModal = lazy(() => import('./CreateEventModal.jsx').then(m => ({ default: m.CreateEventModal })));
const ReportView = lazy(() => import('./ReportView.jsx').then(m => ({ default: m.ReportView })));

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const EmptyState = ({ onRun, isRunning, t }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className='flex flex-col items-center justify-center py-20 text-center bg-[#0F172A]/40 border border-white/[0.06] rounded-2xl p-8 max-w-2xl mx-auto'
  >
    <div className='w-16 h-16 rounded-xl bg-slate-800/60 border border-white/[0.08] flex items-center justify-center mb-6'>
      <ArrowTrendingUpIcon className='h-8 w-8 text-slate-400' />
    </div>
    <h3 className='text-base font-bold text-white mb-2'>{t.trends.emptyTitle}</h3>
    <p className='text-xs text-slate-400 max-w-sm mb-8 leading-relaxed'>
      {t.trends.emptyDesc}
    </p>
    <button
      onClick={onRun}
      disabled={isRunning}
      className='bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-2'
    >
      {isRunning ? (
        <ArrowPathIcon className='h-4 w-4 animate-spin' />
      ) : (
        <BoltIcon className='h-4 w-4' />
      )}
      {isRunning ? t.trends.emptyActionBtnLoading : t.trends.emptyActionBtn}
    </button>
  </motion.div>
);

// ─────────────────────────────────────────────
// Main Section Component
// ─────────────────────────────────────────────

export const TrendsSection = ({ clientId, client }) => {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [activeReportId, setActiveReportId] = useState(null);
  const [activeInsightId, setActiveInsightId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState({});

  // TanStack React Query for shared, cached trend reports
  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['agencyTrendReports'],
    queryFn: () => getTrendReports(clientId, 15),
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    refetchOnWindowFocus: false,
  });

  // Set the first report as active if none is selected
  useEffect(() => {
    if (reports.length > 0 && !activeReportId) {
      setActiveReportId(reports[0].id);
    }
  }, [reports, activeReportId]);

  // Group reports by date for the history sidebar
  const groupedReports = groupReportsByDate(reports);

  // Expand the first date group automatically on load
  useEffect(() => {
    const dates = Object.keys(groupedReports);
    if (dates.length > 0 && Object.keys(expandedDates).length === 0) {
      setExpandedDates({ [dates[0]]: true });
    }
  }, [groupedReports, expandedDates]);

  const toggleDateGroup = (dateGroup) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateGroup]: !prev[dateGroup]
    }));
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const response = await runTrendsForClient(clientId);
      const newReport = response?.data || response;
      
      toast.success(t.trends.successAnalysis, { duration: 3000 });
      
      await queryClient.invalidateQueries({ queryKey: ['agencyTrendReports'] });
      await refetch();
      
      if (newReport?.id) {
        setActiveReportId(newReport.id);
      }
    } catch (e) {
      console.error(e);
      toast.error(t.trends.errorScan + e.message, { duration: 5000 });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateEvent = insight => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  const activeReport = reports.find(r => r.id === activeReportId) || reports[0] || null;
  const hasReports = reports.length > 0;

  // Deduplicate active report's insights based on newer reports
  const getUniqueInsightsForReport = (report, allReports) => {
    if (!report) return [];
    const reportIndex = allReports.findIndex(r => r.id === report.id);
    if (reportIndex === -1) return report.insights || [];

    // Newer reports have index < reportIndex
    const newerReports = allReports.slice(0, reportIndex);
    const newerKeys = new Set();
    newerReports.forEach(r => {
      (r.insights || []).forEach(ins => {
        if (ins.title) newerKeys.add(ins.title.trim().toLowerCase());
        if (ins.source_url) {
          try {
            const url = ins.source_url.trim().toLowerCase();
            newerKeys.add(url);
            // Also add pathname for laxer matching
            const urlObj = new URL(ins.source_url);
            if (urlObj.pathname && urlObj.pathname !== '/') {
              newerKeys.add(urlObj.pathname.toLowerCase());
            }
          } catch {
            newerKeys.add(ins.source_url.trim().toLowerCase());
          }
        }
      });
    });

    return (report.insights || []).filter(ins => {
      const titleKey = ins.title?.trim().toLowerCase();
      let urlKey = ins.source_url?.trim().toLowerCase();
      let pathKey = null;
      if (ins.source_url) {
        try {
          const urlObj = new URL(ins.source_url);
          if (urlObj.pathname && urlObj.pathname !== '/') {
            pathKey = urlObj.pathname.toLowerCase();
          }
        } catch {}
      }
      const isDuplicate = newerKeys.has(titleKey) || 
                          (urlKey && newerKeys.has(urlKey)) || 
                          (pathKey && newerKeys.has(pathKey));
      return !isDuplicate;
    });
  };

  const deduplicatedInsights = useMemo(() => {
    return activeReport ? getUniqueInsightsForReport(activeReport, reports) : [];
  }, [activeReport, reports]);

  const reportToShow = useMemo(() => {
    return activeReport ? { ...activeReport, insights: deduplicatedInsights } : null;
  }, [activeReport, deduplicatedInsights]);

  return (
    <div className='w-full max-w-full py-6 px-4 sm:px-6 md:px-8 xl:px-12 space-y-6'>
      {/* Header & Actions */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5'
      >
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-[#1E293B]/40 border border-white/[0.08] flex items-center justify-center'>
            <ArrowTrendingUpIcon className='h-5 w-5 text-blue-400' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-white'>{t.trends.monitoringTitle}</h1>
            <p className='text-xs text-slate-400'>
              {t.trends.monitoringDesc}
            </p>
          </div>
          {isRunning && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className='flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10'
            >
              <span className='w-1.5 h-1.5 rounded-full bg-blue-500' />
              {t.trends.scanningSources}
            </motion.div>
          )}
        </div>

        {/* Global trigger button */}
        <div className='flex items-center gap-3 flex-wrap w-full sm:w-auto'>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className='bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-md'
          >
            {isRunning ? (
              <ArrowPathIcon className='h-4 w-4 animate-spin' />
            ) : (
              <BoltIcon className='h-4 w-4' />
            )}
            {isRunning ? t.trends.scanningBtn : t.trends.searchBtn}
          </button>
        </div>
      </motion.div>

      {/* Main Content Layout */}
      {isLoading ? (
        <div className='flex items-center justify-center py-32'>
          <div className='flex flex-col items-center gap-4'>
            <div className='w-8 h-8 rounded-full border-2 border-slate-500 border-t-transparent animate-spin' />
            <p className='text-sm text-slate-400'>{t.trends.loadingReports}</p>
          </div>
        </div>
      ) : !hasReports ? (
        <EmptyState onRun={handleRun} isRunning={isRunning} t={t} />
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 items-start'>
          {/* Grouped History Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className='rounded-xl border border-white/[0.06] bg-[#121A2C]/20 p-3.5 space-y-3 lg:sticky lg:top-24 max-h-[70vh] overflow-y-auto custom-scrollbar'
          >
            <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 border-b border-white/[0.04] pb-2'>
              {t.trends.searchHistory}
            </p>

            <div className='space-y-2.5'>
              {Object.keys(groupedReports).map(dateGroup => {
                const isExpanded = !!expandedDates[dateGroup];
                return (
                  <div key={dateGroup} className='space-y-1'>
                    <button
                      onClick={() => toggleDateGroup(dateGroup)}
                      className='w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-bold text-blue-400 uppercase tracking-wider hover:bg-white/[0.03] transition-colors text-left'
                    >
                      <span>{dateGroup}</span>
                      <ChevronDownIcon className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className='pl-2 space-y-1 border-l border-white/[0.03] mt-1 ml-1'>
                        {groupedReports[dateGroup].map(report => {
                          const uniqueInsights = getUniqueInsightsForReport(report, reports);
                          const isReportActive = report.id === activeReportId;
                          
                          return (
                            <div key={report.id} className='space-y-1'>
                              {/* If there are multiple scans in the same day, display timestamp header */}
                              {groupedReports[dateGroup].length > 1 && (
                                <div className='text-[8px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 select-none'>
                                  🕒 {t.trends.scanLabel} {new Date(report.generated_at).toLocaleTimeString(lang === 'es' ? 'es-AR' : 'en-US', { hour: '2-digit', minute: '2-digit' })} {lang === 'es' ? 'hs' : ''}
                                </div>
                              )}
                              
                              <div className='space-y-0.5'>
                                {uniqueInsights.length === 0 ? (
                                  <p className='text-[9px] text-slate-650 italic px-2 py-1 select-none'>
                                    {t.trends.noNews}
                                  </p>
                                ) : (
                                  uniqueInsights.map(ins => {
                                    const isInsightActive = isReportActive && activeInsightId === ins.id;
                                    return (
                                      <button
                                        key={ins.id}
                                        onClick={() => {
                                          setActiveReportId(report.id);
                                          setActiveInsightId(ins.id);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[10.5px] leading-snug transition-all font-medium block truncate ${
                                          isInsightActive
                                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/35 shadow-xs font-bold'
                                            : isReportActive
                                              ? 'text-slate-300 hover:bg-white/[0.03] hover:text-white border border-transparent'
                                              : 'text-slate-500 hover:text-slate-350 border border-transparent'
                                        }`}
                                        title={ins.title}
                                      >
                                        • {ins.title}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Main report view */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='w-full min-w-0'
          >
            <AnimatePresence mode='wait'>
              {reportToShow ? (
                <Suspense fallback={
                  <div className='flex items-center justify-center py-20'>
                    <div className='w-6 h-6 rounded-full border-2 border-slate-500 border-t-transparent animate-spin' />
                  </div>
                }>
                  <ReportView
                    key={reportToShow.id}
                    report={reportToShow}
                    client={client}
                    activeInsightId={activeInsightId}
                    onCloseActiveInsight={() => setActiveInsightId(null)}
                    onCreateEvent={handleCreateEvent}
                  />
                </Suspense>
              ) : (
                <div className='text-center py-20 text-xs text-slate-450 select-none'>
                  {t.trends.noActiveReport}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Event Drafting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Suspense fallback={null}>
            <CreateEventModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedInsight(null);
              }}
              insight={selectedInsight}
              clientId={clientId}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};
