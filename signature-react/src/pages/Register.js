/**
 * pages/Register.js
 * New user registration form.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import Navbar from '../components/Navbar';
import './AuthForm.css';

const INITIAL = {
  name: '', loginid: '', password: '',
  mobile: '', email: '', locality: '',
  address: '', city: '', state: '',
};

export default function Register() {
  const [form, setForm]     = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await registerUser(form);
      setSuccess('Registration successful! Please wait for admin activation.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const data = err.response?.data;
      // Show first validation error from DRF
      const msg = data
        ? Object.values(data).flat().join(' ')
        : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card wide">
          <h2>Create Account</h2>
          {error   && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label>Login ID</label>
                <input name="loginid" value={form.loginid} onChange={handleChange} required placeholder="Choose a login ID" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Password" />
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <input name="mobile" value={form.mobile} onChange={handleChange} required maxLength={10} placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email address" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Locality</label>
                <input name="locality" value={form.locality} onChange={handleChange} placeholder="Locality" />
              </div>
              <div className="form-group">
                <label>City</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>State</label>
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Full address" />
              </div>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
