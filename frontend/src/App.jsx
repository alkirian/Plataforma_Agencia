// src/App.jsx

import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Componente de loading
const PageLoader = () => (
  <div className='min-h-screen flex items-center justify-center'>
    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-rambla-accent'></div>
  </div>
);

// Componente para la lógica de la aplicación principal post-autenticación
const MainApp = ({ session, profile }) => {
  // ✅ CORRECCIÓN #2: Añadimos una guarda para asegurarnos que la sesión no es nula.
  if (!session) {
    return <Navigate to='/' />; // O mostrar un loader
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <BrowserRouter>
      <MainLayout userEmail={session.user.email} onLogout={handleLogout}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path='/dashboard' element={<DashboardPage />} />
            <Route path='/clients/:id' element={<ClientDetailPage />} />
            <Route path='/settings' element={<SettingsPage />} />
            <Route path='*' element={<Navigate to='/dashboard' />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </BrowserRouter>
  );
};

// Componente Raíz que gestiona el estado de autenticación
function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ CORRECCIÓN #1: Movemos getProfile aquí, fuera y antes del useEffect.
  const getProfile = async user => {
    try {
      // No necesitamos setLoading(true) aquí, ya se maneja fuera.
      const { data, error } = await supabase.from('profiles').select(`*`).eq('id', user.id);
      if (error) throw error;
      setProfile(data?.[0] || null);
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
    } finally {
      // El loading general se desactiva en el handleSession
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleSession = session => {
      setSession(session);
      if (session) {
        localStorage.setItem('authToken', session.access_token);
        getProfile(session.user); // Ahora 'getProfile' es visible aquí
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

  if (loading) {
    return <div className='min-h-screen flex items-center justify-center'>Cargando...</div>;
  }
  if (!session) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage />
      </Suspense>
    );
  }
  if (!profile) {
    return <Onboarding session={session} onProfileComplete={() => getProfile(session.user)} />;
  }

  return <MainApp session={session} profile={profile} />;
}

export default App;
