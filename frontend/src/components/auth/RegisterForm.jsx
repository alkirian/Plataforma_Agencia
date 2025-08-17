import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

const inputClass =
  'w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30';
const primaryBtn = 'w-full btn-cyber px-4 py-2 font-semibold';

export const RegisterForm = () => {
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // Opcional: guardar datos extra en tabla profiles después de confirmar email
      if (process.env.NODE_ENV === 'development') {
        console.log('SignUp sent. Confirm email flow may be required.', data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className='space-y-4'>
      {error && <p className='text-sm text-red-400'>{error}</p>}
      <input
        type='text'
        placeholder='Tu nombre completo'
        className={inputClass}
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        required
      />
      <input
        type='text'
        placeholder='Nombre de tu agencia'
        className={inputClass}
        value={agencyName}
        onChange={e => setAgencyName(e.target.value)}
        required
      />
      <input
        type='email'
        placeholder='Email'
        className={inputClass}
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type='password'
        placeholder='Contraseña'
        className={inputClass}
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type='submit' disabled={loading} className={primaryBtn}>
        {loading ? 'Creando…' : 'Crear Cuenta'}
      </button>
    </form>
  );
};
