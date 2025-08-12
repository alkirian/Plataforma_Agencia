import React from 'react';
import { Header } from './Header';

export const MainLayout = ({ children, userEmail, onLogout }) => {
	return (
		<div className="app-layout">
			<Header userEmail={userEmail} onLogout={onLogout} />
			<main className="app-content" style={{maxWidth:1200,margin:'20px auto',padding:'0 16px'}}>
				{children}
			</main>
		</div>
	);
};
