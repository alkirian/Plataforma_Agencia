import React from 'react';
import { Header } from './Header';

export const MainLayout = ({ children, userEmail, onLogout }) => {
	return (
		// El fondo y el texto principal se definen aquí
		<div className="min-h-screen bg-glow-bg-end text-rambla-text-primary">
			<Header userEmail={userEmail} onLogout={onLogout} />
			<main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
				{children}
			</main>
		</div>
	);
};
