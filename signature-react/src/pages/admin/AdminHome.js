/**
 * pages/admin/AdminHome.js
 * Admin dashboard — info card with navigation to user management.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import '../user/UserLayout.css';

export default function AdminHome() {
  const navigate = useNavigate();

  return (
    <div className="user-layout">
      <AdminSidebar />
      <main className="user-main">
        <div className="page-header">
          <h1>🛡️ Admin Dashboard</h1>
          <p>Manage users and monitor the Signature Verification system</p>
        </div>

        <div className="card-grid">
          <div className="feature-card" onClick={() => navigate('/admin/users')}>
            <div className="card-icon">👥</div>
            <h3>Manage Users</h3>
            <p>View all registered users, activate pending accounts, or remove users from the system.</p>
            <button className="card-btn">View Users →</button>
          </div>

          <div className="feature-card" style={{ cursor:'default' }}>
            <div className="card-icon">🤖</div>
            <h3>Powered by Deep Learning</h3>
            <p>
              The system uses a Siamese Neural Network trained on thousands of genuine
              and forged signature pairs to verify authenticity with high accuracy.
            </p>
          </div>
        </div>

        <div className="info-card">
          <h3>System Info</h3>
          <div style={{ color:'#ccc', lineHeight:2, fontSize:'0.95rem' }}>
            <div>🔑 <strong style={{color:'#00ffc8'}}>Admin Login:</strong> admin / admin</div>
            <div>🗄️ <strong style={{color:'#00ffc8'}}>Database:</strong> SQLite (db.sqlite3)</div>
            <div>🧠 <strong style={{color:'#00ffc8'}}>Model:</strong> Siamese Network (Keras)</div>
            <div>🌐 <strong style={{color:'#00ffc8'}}>API:</strong> Django REST Framework + JWT</div>
          </div>
        </div>
      </main>
    </div>
  );
}
