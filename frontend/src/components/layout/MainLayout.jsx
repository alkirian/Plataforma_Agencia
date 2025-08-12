import React from 'react';
import { Header } from './Header';

export const MainLayout = ({ children, userEmail, onLogout }) => {
	return (
		<div className="app-layout">
			<Header userEmail={userEmail} onLogout={onLogout} />
			<main className="app-content">
				{children}
			</main>
		</div>
	);
};
