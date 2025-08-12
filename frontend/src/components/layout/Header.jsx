import React from 'react';
import { Link } from 'react-router-dom';

export const Header = ({ userEmail, onLogout }) => {
	return (
		<header className="app-header">
			<div className="header-left">
				<Link to="/dashboard" className="header-button">Inicio</Link>
				<button className="header-button">Notificaciones</button>
				<input type="search" placeholder="Buscar..." className="header-search" />
			</div>
			<div className="header-right">
				<div className="user-menu">
					<span>{userEmail}</span>
					<button onClick={onLogout} className="logout-button">Cerrar Sesión</button>
				</div>
			</div>
		</header>
	);
};
