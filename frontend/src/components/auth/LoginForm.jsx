import React from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../supabaseClient';

const inputClass = 'w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-glow-cyan focus:outline-none focus:ring-2 focus:ring-glow-cyan/30';
const primaryBtn = 'w-full rounded-md bg-rambla-accent px-4 py-2 font-semibold text-white transition hover:opacity-90';
const googleBtn = 'w-full rounded-md border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10';
const errorClass = 'mt-1 text-sm text-red-400';

export const LoginForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setError } = useForm();

  const onSubmit = async (data) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      reset();
    } catch (err) {
      setError('root', { type: 'manual', message: err.message });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (err) {
      setError('root', { type: 'manual', message: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && <p className={errorClass}>{errors.root.message}</p>}
      <div>
        <input
          type="email"
          placeholder="Email"
          className={inputClass}
          {...register('email', { required: 'El email es obligatorio' })}
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>
      <div>
        <input
          type="password"
          placeholder="Contraseña"
          className={inputClass}
          {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
          })}
        />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className={primaryBtn}>
        {isSubmitting ? 'Iniciando…' : 'Iniciar Sesión'}
      </button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-glow-card-bg px-2 text-rambla-text-secondary">o</span>
        </div>
      </div>
      <button type="button" onClick={handleGoogleLogin} disabled={isSubmitting} className={googleBtn}>
        Continuar con Google
      </button>
    </form>
  );
};
