/**
 * components/UserSidebar.js
 * Sidebar navigation for logged-in users.
 */
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth } from '../services/api';
import './UserSidebar.css';

export default function UserSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <aside className="user-sidebar">
      <div className="sidebar-brand">✍️ SigVerify</div>
      <nav className="sidebar-nav">
        <NavLink to="/user/home"       className={({ isActive }) => isActive ? 'active' : ''}>🏠 Home</NavLink>
        <NavLink to="/user/train"      className={({ isActive }) => isActive ? 'active' : ''}>🧠 Train Model</NavLink>
        <NavLink to="/user/predict"    className={({ isActive }) => isActive ? 'active' : ''}>🔍 Verify Signature</NavLink>
      </nav>
      <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
    </aside>
  );
}
