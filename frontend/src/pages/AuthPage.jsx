import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' o 'register'

  const tabButtonClasses = (tabName) =>
    `w-1/2 py-3 text-center font-semibold transition-colors duration-300
     ${activeTab === tabName
       ? 'text-glow-cyan border-b-2 border-glow-cyan'
       : 'text-rambla-text-secondary hover:text-white'
     }`;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-glow-card-bg p-6 backdrop-blur-lg shadow-lg">
        {/* Pestañas */}
        <div className="mb-6 flex">
          <button onClick={() => setActiveTab('login')} className={tabButtonClasses('login')}>
            Iniciar Sesión
          </button>
          <button onClick={() => setActiveTab('register')} className={tabButtonClasses('register')}>
            Crear Cuenta
          </button>
        </div>

        {/* Contenido del formulario */}
        <div>
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
};
