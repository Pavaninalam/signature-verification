/**
 * components/AdminSidebar.js
 * Sidebar navigation for the admin panel.
 */
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth } from '../services/api';
import './UserSidebar.css'; // reuse same sidebar styles

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    clearAuth();
    navigate('/admin/login');
  };

  return (
    <aside className="user-sidebar">
      <div className="sidebar-brand">🛡️ Admin Panel</div>
      <nav className="sidebar-nav">
        <NavLink to="/admin/home"  className={({ isActive }) => isActive ? 'active' : ''}>🏠 Dashboard</NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>👥 Manage Users</NavLink>
      </nav>
      <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
    </aside>
  );
}
