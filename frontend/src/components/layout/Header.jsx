import React from 'react';
import { Link } from 'react-router-dom';

export const Header = ({ userEmail, onLogout }) => {
	return (
		<header className="app-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #e5e7eb'}}>
			<div className="header-left" style={{display:'flex',gap:'8px',alignItems:'center'}}>
				<Link to="/dashboard" className="header-button" style={{textDecoration:'none',padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:8}}>Inicio</Link>
				<button className="header-button" style={{padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:8,background:'#fff',cursor:'pointer'}}>Notificaciones</button>
				<input type="search" placeholder="Buscar..." className="header-search" style={{padding:'6px 10px',border:'1px solid #cbd5e1',borderRadius:8}} />
			</div>
			<div className="header-right">
				<div className="user-menu" style={{display:'flex',gap:'10px',alignItems:'center'}}>
					<span>{userEmail}</span>
					<button onClick={onLogout} className="logout-button" style={{padding:'6px 10px',border:'1px solid #ef4444',color:'#ef4444',background:'#fff',borderRadius:8,cursor:'pointer'}}>Cerrar Sesión</button>
				</div>
			</div>
		</header>
	);
};
