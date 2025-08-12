import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import { Onboarding } from './components/Onboarding.jsx'; // Importamos el nuevo componente
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // Nuevo estado para guardar el perfil
  const [loading, setLoading] = useState(true);

  // Esta función revisa si el usuario logueado ya tiene un perfil en nuestra tabla 'profiles'
  const getProfile = async (user) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', user.id)
        .single(); // .single() hace que devuelva un solo objeto o null si no lo encuentra

      if (error && error.code !== 'PGRST116') { // PGRST116 es el código para "cero filas encontradas", lo cual no es un error para nosotros.
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Al cargar, obtenemos la sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Si hay sesión, intentamos obtener el perfil del usuario
      if (session) {
        getProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escuchamos cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setProfile(null); // Limpiamos el perfil anterior al cambiar de sesión
      // Si hay una nueva sesión, obtenemos su perfil
      if (session) {
        getProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  // Mientras carga la sesión o el perfil, mostramos un mensaje
  if (loading) {
    return <div className="container">Cargando...</div>;
  }
  
  // Renderizado condicional principal
  let content;
  if (!session) {
    // VISTA 1: Usuario no logueado
    content = (
      <div className="card">
        <p>Inicia sesión para continuar.</p>
        <button onClick={handleGoogleLogin}>Iniciar sesión con Google</button>
      </div>
    );
  } else if (session && !profile) {
    // VISTA 2: Usuario logueado pero sin perfil (Onboarding)
    content = <Onboarding session={session} onProfileComplete={() => getProfile(session.user)} />;
  } else {
    // VISTA 3: Usuario logueado y con perfil (App principal)
    content = (
      <div className="card">
        <h2>¡Bienvenido a tu agencia, {profile.full_name}!</h2>
        <p>Tu ID de agencia es: {profile.agency_id}</p>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Software Rambla</h1>
      {content}
    </div>
  );
}

export default App;
