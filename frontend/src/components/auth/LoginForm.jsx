import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

const inputClass = 'w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-glow-cyan focus:outline-none focus:ring-2 focus:ring-glow-cyan/30';
const primaryBtn = 'w-full rounded-md bg-rambla-accent px-4 py-2 font-semibold text-white transition hover:opacity-90';
const googleBtn = 'w-full rounded-md border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <input type="email" placeholder="Email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Contraseña" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit" disabled={loading} className={primaryBtn}>{loading ? 'Entrando…' : 'Iniciar Sesión'}</button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-glow-card-bg px-2 text-rambla-text-secondary">o</span>
        </div>
      </div>
      <button type="button" onClick={handleGoogleLogin} disabled={loading} className={googleBtn}>Continuar con Google</button>
    </form>
  );
};
