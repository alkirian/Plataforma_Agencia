// src/pages/InviteAcceptPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import logger from '../utils/logger';
import { smartToast } from '../utils/toastManager';
import { validateInvitation, acceptInvitation } from '../api/invitations.js';

/**
 * Page for accepting organization invitations
 */
export const InviteAcceptPage = () => {
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('member');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      loadInviteData(token);
    } else {
      logger.warn('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  const loadInviteData = async (inviteToken) => {
    try {
      const res = await validateInvitation(inviteToken);
      setInviteData(res?.data || null);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading invitation data', { error: error.message, token: inviteToken });
      smartToast.error('Invitación no válida o expirada');
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!fullName.trim()) {
      smartToast.error('Por favor ingresa tu nombre');
      return;
    }
    setProcessing(true);
    try {
      const res = await acceptInvitation({ token, fullName, role });
      smartToast.success('Invitación aceptada');
      if (res?.data?.needsEmailVerification) {
        smartToast.info('Revisa tu email para completar el acceso');
      }
      navigate('/welcome');
    } catch (error) {
      logger.error('Error accepting invitation', { error: error.message, token });
      smartToast.error(error.message || 'Error al aceptar la invitación');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvite = async () => {
    setProcessing(true);
    try {
      // Here you would decline the invitation via API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      smartToast.info('Invitación rechazada');
      logger.info('Invitation declined', { token });
      
      // Redirect to home
      navigate('/');
    } catch (error) {
      logger.error('Error declining invitation', { error: error.message, token });
      smartToast.error('Error al procesar la respuesta');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-muted">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (!inviteData && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Invitación No Válida</h1>
          <p className="text-text-muted mb-6">
            La invitación no es válida o ha expirado.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-cyber px-6 py-2"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card rounded-xl p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-cyber-gradient mb-2">
            Invitación Recibida
          </h1>
        </div>

        {inviteData && (
          <div className="space-y-4 mb-8">
            <div className="text-center">
              <p className="text-text-muted mb-2">Has sido invitado a unirte a</p>
              <h2 className="text-xl font-semibold text-text-primary">{inviteData.organizationName}</h2>
            </div>
            
            <div className="bg-surface-soft rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">Invitado por:</p>
              <p className="font-medium text-text-primary">{inviteData.inviterName}</p>
              <p className="text-sm text-text-muted">{inviteData.inviterEmail}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-text-muted mb-1">Tu nombre</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary"
                  placeholder="Ingresa tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-surface-soft px-3 py-2 text-text-primary"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleAcceptInvite}
            disabled={processing}
            className="w-full btn-cyber px-4 py-3 font-semibold disabled:opacity-60"
          >
            {processing ? 'Procesando...' : 'Aceptar Invitación'}
          </button>
          
          <button
            onClick={handleDeclineInvite}
            disabled={processing}
            className="w-full bg-surface-subtle text-text-primary border border-border-subtle rounded-lg px-4 py-3 font-medium hover:bg-surface-soft transition-colors disabled:opacity-60"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
};
