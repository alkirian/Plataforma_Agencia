// src/hooks/useAuth.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener perfil del usuario
  const getProfile = useCallback(async (user) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id);
      if (error) throw error;
      setProfile(data?.[0] || null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error al obtener el perfil:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await getProfile(session.user);
    }
  }, [session, getProfile]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    const handleSession = (currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        localStorage.setItem('authToken', currentSession.access_token);
        getProfile(currentSession.user);
      } else {
        localStorage.removeItem('authToken');
        setProfile(null);
        setLoading(false);
      }
    };

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleSession(initialSession);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      handleSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, [getProfile]);

  const value = {
    session,
    user: session?.user || null,
    userEmail: session?.user?.email || null,
    profile,
    loading,
    logout: handleLogout,
    refreshProfile,
    getProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
