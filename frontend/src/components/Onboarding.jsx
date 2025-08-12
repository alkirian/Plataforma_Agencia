import { useState } from 'react';

// Este componente recibe la sesión del usuario y una función para indicar que el perfil se completó.
export const Onboarding = ({ session, onProfileComplete }) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/v1/users/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ¡Aquí enviamos el token de autenticación! Nuestro backend lo usará para saber quiénes somos.
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fullName, agencyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al completar el perfil.');
      }

      alert('¡Agencia creada exitosamente!');
      onProfileComplete(); // Avisamos al componente padre que ya terminamos.
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Completa tu registro</h2>
      <p>¡Bienvenido! Solo un paso más para empezar.</p>
      <form onSubmit={handleCompleteProfile}>
        <div>
          <label htmlFor="fullName">Tu nombre completo:</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="agencyName">Nombre de tu agencia:</label>
          <input
            id="agencyName"
            type="text"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Agencia'}
        </button>
      </form>
    </div>
  );
};
