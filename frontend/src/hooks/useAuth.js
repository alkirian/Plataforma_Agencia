/**
 * Hook para gestionar autenticación y información del usuario
 * Proporciona acceso al usuario actual y sus datos
 */

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await getProfile(session.user);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await getProfile(session.user);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const getProfile = async (user) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (profile?.name) {
      return profile.name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      // Extraer nombre del email si no hay nombre disponible
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Usuario';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    const words = displayName.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    isAuthenticated,
    getUserDisplayName,
    getUserInitials,
    signOut,
    
    // Datos útiles para notificaciones
    userData: {
      id: user?.id,
      email: user?.email,
      displayName: getUserDisplayName(),
      initials: getUserInitials(),
      avatar: profile?.avatar_url || null
    }
  };
};