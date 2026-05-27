// src/App.jsx

import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Onboarding } from '@components/Onboarding.jsx';
import { MainLayout } from '@components/layout/MainLayout.jsx';
import { useAuth } from './hooks/useAuth.jsx';
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

// Componente de loading
const PageLoader = () => (
  <div className='min-h-screen flex items-center justify-center'>
    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-rambla-accent'></div>
  </div>
);

// Componente Raíz que gestiona el estado de autenticación y navegación unificada
function App() {
  const { session, profile, loading, logout, getProfile } = useAuth();

  useEffect(() => {
    // Inicializar tema global
    const savedTheme = localStorage.getItem('cadence-theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-[#07070E] flex flex-col items-center justify-center select-none gap-6'>
        <div className='relative w-16 h-16'>
          {/* Pulsing glow behind */}
          <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#4ECDC4] blur-lg opacity-40 animate-pulse' />
          {/* Spinning premium gradient ring */}
          <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#4ECDC4] p-[1.5px] animate-spin' style={{ animationDuration: '3s' }}>
            <div className='w-full h-full bg-[#07070E] rounded-[14px]' />
          </div>
          {/* Central Logo Letter R */}
          <div className='absolute inset-0 flex items-center justify-center font-title font-black text-white text-xl'>
            R
          </div>
        </div>
        <div className='flex flex-col items-center gap-1.5'>
          <span className='font-title font-black text-sm tracking-widest text-text-primary uppercase'>
            Rambla Studio
          </span>
          <span className='text-[10px] tracking-[0.15em] text-text-muted uppercase font-semibold animate-pulse'>
            Cargando entorno creativo...
          </span>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 1. PORTALES PÚBLICOS STANDALONE (Sin login ni MainLayout) */}
        <Route path='/shared/approval/:token' element={<ApprovalPortalPage />} />
        <Route path='/join/:code' element={<JoinPage />} />

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
  );
}

export default App;

