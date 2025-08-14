import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Onboarding } from './components/Onboarding.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { MainLayout } from './components/layout/MainLayout.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ClientDetailPage } from './pages/ClientDetailPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import './App.css';

// Componente para la lógica de la aplicación principal post-autenticación
const MainApp = ({ session, profile }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <BrowserRouter>
      <MainLayout userEmail={session.user.email} onLogout={handleLogout}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Ruta dinámica para detalle de cliente */}
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

// LoginPage ha sido reemplazada por AuthPage

// Componente Raíz que gestiona el estado de autenticación
function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProfile = async (user) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select(`*`).eq('id', user.id);
      if (error) throw error;
      setProfile(data?.[0] || null);
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) getProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setProfile(null);
      if (session) getProfile(session.user);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="container">Cargando...</div>;
  }
  if (!session) {
    return <AuthPage />;
  }
  if (!profile) {
    return <Onboarding session={session} onProfileComplete={() => getProfile(session.user)} />;
  }

  return <MainApp session={session} profile={profile} />;
}

export default App;
