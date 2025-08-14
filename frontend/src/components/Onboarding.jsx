import { useState } from 'react';

export const Onboarding = ({ session, onProfileComplete }) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');

  // Obtenemos la URL base de la API desde las variables de entorno de Vite
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usamos la variable de entorno para la URL
      const response = await fetch(`${API_URL}/users/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
    <div className="min-h-screen bg-rambla-bg text-rambla-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-rambla-border bg-rambla-surface p-6 shadow">
        <h2 className="mb-1 text-2xl font-bold text-white">Completa tu registro</h2>
        <p className="mb-6 text-sm text-rambla-text-secondary">¡Bienvenido! Solo un paso más para empezar.</p>
        <form onSubmit={handleCompleteProfile} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm text-rambla-text-secondary">Tu nombre completo</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="agencyName" className="mb-1 block text-sm text-rambla-text-secondary">Nombre de tu agencia</label>
            <input
              id="agencyName"
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-rambla-accent px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Creando...' : 'Crear Agencia'}
          </button>
        </form>
      </div>
    </div>
  );
};