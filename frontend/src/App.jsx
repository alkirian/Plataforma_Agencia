// src/App.jsx

import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Onboarding } from '@components/Onboarding.jsx';
import { MainLayout } from '@components/layout/MainLayout.jsx';
import { CadenceLogoCronogramaDigital, InteractiveGradientBg } from '@components/ui';
import { useAuth, useLanguage } from './hooks';
import './App.css';

// Lazy loading de páginas para mejor performance
const AuthPage = lazy(() =>
  import('@pages/AuthPage.jsx').then(module => ({ default: module.AuthPage }))
);
const DashboardPage = lazy(() =>
  import('@pages/DashboardPage.jsx').then(module => ({ default: module.DashboardPage }))
);
const ClientDetailPage = lazy(() =>
  import('@pages/ClientDetailPage.jsx').then(module => ({ default: module.ClientDetailPage }))
);
const SettingsPage = lazy(() =>
  import('@pages/SettingsPage.jsx').then(module => ({ default: module.SettingsPage }))
);
const TrendsPage = lazy(() =>
  import('@pages/TrendsPage.jsx').then(module => ({ default: module.TrendsPage }))
);
const ApprovalPortalPage = lazy(() =>
  import('@pages/ApprovalPortalPage.jsx').then(module => ({ default: module.ApprovalPortalPage }))
);
const JoinPage = lazy(() =>
  import('@pages/JoinPage.jsx').then(module => ({ default: module.JoinPage }))
);
const CharacterPlaygroundPage = lazy(() =>
  import('@pages/CharacterPlaygroundPage.jsx').then(module => ({ default: module.CharacterPlaygroundPage }))
);

// Componente de loading
const PageLoader = () => (
  <div className='min-h-screen flex items-center justify-center'>
    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-accent-violet'></div>
  </div>
);

// Componente Raíz que gestiona el estado de autenticación y navegación unificada
function App() {
  const { session, profile, loading, logout, getProfile } = useAuth();
  const { t } = useLanguage();
  
  // Control de la pantalla de bienvenida premium
  const [splashMounted, setSplashMounted] = useState(true);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [forceLoad, setForceLoad] = useState(false);

  const appLoading = loading && !forceLoad;

  useEffect(() => {
    // Inicializar tema global
    const savedTheme = localStorage.getItem('cadence-theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Inicializar mensaje de carga según el idioma activo
  useEffect(() => {
    setLoadingMessage(t.splash.creative);
  }, [t]);

  // Controlar mensajes de carga dinámicos si la base de datos está en frío
  useEffect(() => {
    if (loading && !forceLoad) {
      const timers = [
        setTimeout(() => {
          setLoadingMessage(t.splash.connection);
        }, 4000),
        setTimeout(() => {
          setLoadingMessage(t.splash.dbCold);
        }, 8000),
        setTimeout(() => {
          setLoadingMessage(t.splash.dbSlow);
          setShowSkipButton(true);
        }, 15000)
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [loading, forceLoad, t]);

  useEffect(() => {
    if (!appLoading) {
      // Retardo para dejar completar la espectacular animación y luego desvanecer suavemente
      const fadeTimer = setTimeout(() => {
        setShouldFadeOut(true);
      }, 1200); // Retardo menor si forzamos carga o cargó normal
      
      const unmountTimer = setTimeout(() => {
        setSplashMounted(false);
      }, 2000);
      
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [appLoading]);

  return (
    <>
      {/* Global Dynamic Fluid Canvas Background */}
      <InteractiveGradientBg />

      {/* 1. Pantalla de Entrada Splash Premium */}
      {splashMounted && (
        <motion.div 
          className='fixed inset-0 min-h-screen bg-[#07070E] flex flex-col items-center justify-center select-none z-[9999] overflow-hidden'
          initial={{ opacity: 1 }}
          animate={shouldFadeOut ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <div className='relative w-28 h-28 flex items-center justify-center'>
            {/* Expansive deep-ambient glow */}
            <motion.div 
              className='absolute inset-0 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#6366F1] blur-3xl opacity-25'
              initial={{ scale: 0.6 }}
              animate={{ scale: [0.6, 1.1, 0.9, 1] }}
              transition={{ duration: 2.0, ease: "easeOut" }}
            />
            
            <CadenceLogoCronogramaDigital 
              className="w-24 h-24 relative z-10" 
              startColor="#A78BFA" 
              endColor="#6366F1"
              animated={true} 
            />
          </div>

          <motion.div 
            className='flex flex-col items-center gap-2 mt-6'
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className='font-title font-black text-lg sm:text-xl tracking-[0.25em] text-[#eeeeff] uppercase select-none flex'
              initial={{ letterSpacing: "0.15em" }}
              animate={{ letterSpacing: "0.3em" }}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.8 }}
            >
              {"Cadence".split("").map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.08, ease: "backOut" }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.h1>
            
            <motion.span 
              className='text-[9.5px] tracking-[0.12em] text-[#8080a0] uppercase font-bold select-none text-center px-6 max-w-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 0.85, 0.5] }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.0, 
                ease: "easeInOut"
              }}
            >
              {loadingMessage}
            </motion.span>

            <AnimatePresence>
              {showSkipButton && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setForceLoad(true)}
                  className='mt-4 px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase bg-white/5 border border-white/10 text-[#eeeeff] hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md relative z-50'
                >
                  {t.splash.skip}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      {!appLoading && (
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 1. PORTALES PÚBLICOS STANDALONE (Sin login ni MainLayout) */}
            <Route path='/shared/approval/:token' element={<ApprovalPortalPage />} />
            <Route path='/join/:code' element={<JoinPage />} />
            <Route path='/test-character' element={<CharacterPlaygroundPage />} />

            {/* 2. RUTA COMPLETA PROTEGIDA Y DINÁMICA */}
            <Route
              path='/*'
              element={
                !session ? (
                  <Suspense fallback={<PageLoader />}>
                    <AuthPage />
                  </Suspense>
                ) : (!profile || !profile.agency_id) ? (
                  <Onboarding session={session} onProfileComplete={() => getProfile(session.user)} />
                ) : (
                  <MainLayout userEmail={session.user.email} profile={profile} onLogout={logout}>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path='/dashboard' element={<DashboardPage />} />
                        <Route path='/clients/:id' element={<ClientDetailPage />} />
                        <Route
                          path='/settings'
                          element={
                            <SettingsPage
                              profile={profile}
                              session={session}
                              onProfileUpdate={() => getProfile(session.user)}
                            />
                          }
                        />
                        <Route path='/trends' element={<TrendsPage />} />
                        {/* Redirección por defecto si la ruta de autenticado no existe */}
                        <Route path='*' element={<Navigate to='/dashboard' replace />} />
                      </Routes>
                    </Suspense>
                  </MainLayout>
                )
              }
            />
          </Routes>
        </Suspense>
      )}
    </>
  );
}

export default App;

