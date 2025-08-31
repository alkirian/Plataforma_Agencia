import React, { Suspense } from 'react';

// Reutilizamos la AuthPage existente como contenido de bienvenida
const AuthPage = React.lazy(() => import('@pages/AuthPage.jsx').then(m => ({ default: m.AuthPage })));

export const WelcomePage = () => {
  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center'>Cargando…</div>}>
      <AuthPage />
    </Suspense>
  );
};

