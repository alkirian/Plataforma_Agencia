import React from 'react';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { Toaster } from 'react-hot-toast';

export const MainLayout = ({ children, userEmail, onLogout }) => {
	return (
		// El fondo y el texto principal se definen aquí
		<div className="min-h-screen bg-glow-bg-end text-rambla-text-primary">
			<Header userEmail={userEmail} onLogout={onLogout} />
			<Toaster
				position="bottom-right"
				toastOptions={{
					style: {
						background: '#0b1220',
						color: '#c9d1d9',
						border: '1px solid #30363d',
					},
				}}
			/>
			<main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
				<Breadcrumbs />
				{children}
			</main>
		</div>
	);
};
