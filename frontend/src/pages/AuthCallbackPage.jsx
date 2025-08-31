// src/pages/AuthCallbackPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logger from '../utils/logger';
import { smartToast } from '../utils/toastManager';

/**
 * Página para manejar el callback de autenticación de Supabase
 * Se ejecuta después del login/registro con proveedores externos
 */
export const AuthCallbackPage = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Obtener el fragmento de la URL que contiene los tokens
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        logger.error('Auth callback error', { 
          error, 
          errorDescription,
          fullUrl: window.location.href 
        });
        smartToast.error(`Error de autenticación: ${errorDescription || error}`);
        navigate('/auth');
        return;
      }

      if (accessToken && refreshToken) {
        // Establecer la sesión manualmente
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          logger.error('Error setting session from callback', { 
            error: sessionError.message 
          });
          smartToast.error('Error al establecer la sesión');
          navigate('/auth');
          return;
        }

        logger.info('Auth callback successful', { 
          userId: data.user?.id,
          email: data.user?.email 
        });

        smartToast.success('¡Autenticación exitosa!');
        
        // Redirigir según el estado del usuario
        const redirectPath = localStorage.getItem('auth-redirect') || '/dashboard';
        localStorage.removeItem('auth-redirect');
        navigate(redirectPath, { replace: true });
      } else {
        // Si no hay tokens en el hash, intentar obtener la sesión actual
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          logger.error('Error getting session in callback', { 
            error: getSessionError.message 
          });
          navigate('/auth');
          return;
        }

        if (session) {
          logger.info('Session found in callback', { 
            userId: session.user?.id 
          });
          navigate('/dashboard', { replace: true });
        } else {
          logger.warn('No session or tokens found in auth callback');
          navigate('/auth');
        }
      }
    } catch (error) {
      logger.error('Unexpected error in auth callback', { 
        error: error.message,
        stack: error.stack,
        url: window.location.href
      });
      smartToast.error('Error inesperado durante la autenticación');
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-muted">Completando autenticación...</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-text-muted">Redirigiendo...</p>
          </>
        )}
      </div>
    </div>
  );
};