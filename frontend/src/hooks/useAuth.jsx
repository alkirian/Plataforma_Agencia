import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const lastFetchedUserId = useRef(null);

  // Obtener perfil del usuario
  const getProfile = useCallback(async (user) => {
    if (lastFetchedUserId.current === user.id && profile) {
      setLoading(false);
      return;
    }
    lastFetchedUserId.current = user.id;

    try {
      const { data, error } = await supabase.from('profiles').select('*, agencies(name, agency_type)').eq('id', user.id);
      if (error) throw error;
      setProfile(data?.[0] || null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error al obtener el perfil:', error);
      }
      lastFetchedUserId.current = null; // Permitir reintento si falló
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      // Forzar recarga limpiando el registro temporal
      lastFetchedUserId.current = null;
      await getProfile(session.user);
    }
  }, [session, getProfile]);

  const handleLogout = useCallback(async () => {
    lastFetchedUserId.current = null;
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    let active = true;

    const handleSession = (currentSession) => {
      if (!active) return;
      setSession(currentSession);
      if (currentSession) {
        localStorage.setItem('authToken', currentSession.access_token);
        getProfile(currentSession.user);
      } else {
        localStorage.removeItem('authToken');
        lastFetchedUserId.current = null;
        setProfile(null);
        setLoading(false);
      }
    };

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (active) {
        handleSession(initialSession);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (active) {
        handleSession(currentSession);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [getProfile]);

  const isOwnBusiness = profile?.agencies?.agency_type === 'own_business';

  const value = {
    session,
    user: session?.user || null,
    userEmail: session?.user?.email || null,
    profile,
    isOwnBusiness,
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
