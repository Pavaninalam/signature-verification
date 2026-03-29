/**
 * pages/admin/AdminLogin.js
 * Admin login — stores admin JWT separately under 'adminToken'.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../services/api';
import Navbar from '../../components/Navbar';
import '../AuthForm.css';

export default function AdminLogin() {
  const [form, setForm]       = useState({ loginid: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(form);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <h2>🛡️ Admin Login</h2>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Admin ID</label>
              <input
                name="loginid"
                value={form.loginid}
                onChange={handleChange}
                required
                placeholder="Enter admin ID"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
