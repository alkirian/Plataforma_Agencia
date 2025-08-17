import { useState } from 'react';

export const Onboarding = ({ session, onProfileComplete }) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');

  // Obtenemos la URL base de la API desde las variables de entorno de Vite
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleCompleteProfile = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usamos la variable de entorno para la URL
      const response = await fetch(`${API_URL}/users/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fullName, agencyName }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al completar el perfil.');
      }

      alert('¡Agencia creada exitosamente!');
      onProfileComplete();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen text-text-primary flex items-center justify-center p-6'>
      <div className='w-full max-w-md card rounded-xl p-6'>
        <h2 className='mb-1 text-2xl font-bold text-cyber-gradient'>Completa tu registro</h2>
        <p className='mb-6 text-sm text-text-muted'>
          ¡Bienvenido! Solo un paso más para empezar.
        </p>
        <form onSubmit={handleCompleteProfile} className='space-y-4'>
          <div>
            <label htmlFor='fullName' className='mb-1 block text-sm text-text-muted'>
              Tu nombre completo
            </label>
            <input
              id='fullName'
              type='text'
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none'
              required
            />
          </div>
          <div>
            <label htmlFor='agencyName' className='mb-1 block text-sm text-text-muted'>
              Nombre de tu agencia
            </label>
            <input
              id='agencyName'
              type='text'
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              className='w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none'
              required
            />
          </div>
          <button
            type='submit'
            disabled={loading}
            className='w-full btn-cyber px-4 py-2 font-semibold hover-cyber-glow disabled:opacity-60'
          >
            {loading ? 'Creando...' : 'Crear Agencia'}
          </button>
        </form>
      </div>
    </div>
  );
};
