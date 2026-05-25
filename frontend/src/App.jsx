// src/App.jsx

import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Onboarding } from '@components/Onboarding.jsx';
import { MainLayout } from '@components/layout/MainLayout.jsx';
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
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener perfil del usuario
  const getProfile = async user => {
    try {
      const { data, error } = await supabase.from('profiles').select(`*`).eq('id', user.id);
      if (error) throw error;
      setProfile(data?.[0] || null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al obtener el perfil:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Inicializar tema global
    const savedTheme = localStorage.getItem('cadence-theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  useEffect(() => {
    const handleSession = session => {
      setSession(session);
      if (session) {
        localStorage.setItem('authToken', session.access_token);
        getProfile(session.user);
      } else {
        localStorage.removeItem('authToken');
        setProfile(null);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className='min-h-screen flex items-center justify-center'>Cargando...</div>;
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
            ) : !profile ? (
              <Onboarding session={session} onProfileComplete={() => getProfile(session.user)} />
            ) : (
              <MainLayout userEmail={session.user.email} profile={profile} onLogout={handleLogout}>
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
