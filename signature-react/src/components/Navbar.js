/**
 * components/Navbar.js
 * Public navbar shown on landing, login, register pages.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">✍️</span> SigVerify
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/login">User Login</Link>
        <Link to="/admin/login">Admin Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
}
