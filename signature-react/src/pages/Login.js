/**
 * pages/Login.js
 * User login page — authenticates and stores JWT.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, saveAuth } from '../services/api';
import Navbar from '../components/Navbar';
import './AuthForm.css';

export default function Login() {
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
      const res = await loginUser(form);
      saveAuth(res.data.token, res.data.user);
      navigate('/user/home');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Login failed. Check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <h2>User Login</h2>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Login ID</label>
              <input
                name="loginid"
                value={form.loginid}
                onChange={handleChange}
                required
                placeholder="Enter your login ID"
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
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="auth-footer">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
          <p className="auth-footer">
            No account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
