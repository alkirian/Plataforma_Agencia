import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout = ({ children, userEmail, onLogout }) => {
	return (
		<div className="flex h-screen bg-rambla-bg text-rambla-text-primary">
			<Sidebar />
			<div className="flex flex-1 flex-col overflow-y-auto">
				<Header userEmail={userEmail} onLogout={onLogout} />
				<main className="flex-1 p-6">
					{children}
				</main>
			</div>
		</div>
	);
};
