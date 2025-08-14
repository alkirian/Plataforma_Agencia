import React from 'react';

export const Header = ({ userEmail, onLogout }) => {
	return (
		<header className="flex items-center justify-end p-4">
			<div className="flex items-center space-x-4">
				<span className="text-sm text-rambla-text-secondary">{userEmail}</span>
				<button onClick={onLogout} className="text-sm text-rambla-accent hover:underline">
					Cerrar Sesión
				</button>
			</div>
		</header>
	);
};
