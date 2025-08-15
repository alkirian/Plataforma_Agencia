import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HomeIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export const Header = ({ userEmail, onLogout }) => {
	const navLinkClasses = ({ isActive }) =>
		`rounded-md p-2 transition-colors duration-200 ${
			isActive ? 'bg-glow-cyan/20 text-glow-cyan' : 'text-rambla-text-secondary hover:bg-white/10 hover:text-white'
		}`;

	return (
		<header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur-lg">
			<div className="flex h-16 w-full items-center justify-between px-4">
				{/* Izquierda: Logo */}
				<div className="flex items-center">
					<Link to="/dashboard" className="text-2xl font-bold text-white">
						Rambla
					</Link>
				</div>

				{/* Derecha: Navegación y Menú de Usuario */}
				<div className="flex items-center space-x-4">
					<nav className="flex items-center space-x-2">
						<NavLink to="/dashboard" className={navLinkClasses} title="Dashboard">
							<HomeIcon className="h-6 w-6" />
						</NavLink>
						<NavLink to="/settings" className={navLinkClasses} title="Configuración">
							<Cog6ToothIcon className="h-6 w-6" />
						</NavLink>
					</nav>

					{/* Separador Visual */}
					<div className="h-6 w-px bg-white/10"></div>

					{/* Menú de Usuario */}
					<div className="flex items-center space-x-3">
						 <UserCircleIcon className="h-7 w-7 text-rambla-text-secondary" />
						 <span className="text-sm font-medium text-white">{userEmail}</span>
						 <button onClick={onLogout} className="text-sm text-rambla-text-secondary hover:text-glow-cyan">
							 Salir
						 </button>
					</div>
				</div>
			</div>
		</header>
	);
};
