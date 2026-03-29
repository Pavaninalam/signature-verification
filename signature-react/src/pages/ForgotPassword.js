/**
 * pages/ForgotPassword.js
 * Three-step password reset: email → OTP → new password.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword, verifyOTP, resetPassword } from '../services/api';
import Navbar from '../components/Navbar';
import './AuthForm.css';

export default function ForgotPassword() {
  const [step, setStep]       = useState(1); // 1=email, 2=otp, 3=newpw
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [newPw, setNewPw]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleEmail = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await forgotPassword({ email });
      setSuccess('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Email not found.');
    } finally { setLoading(false); }
  };

  const handleOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await verifyOTP({ email, otp });
      setSuccess('OTP verified. Set your new password.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await resetPassword({ email, new_password: newPw });
      setSuccess('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <h2>
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter OTP'}
            {step === 3 && 'New Password'}
          </h2>

          {/* Step indicator */}
          <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', justifyContent:'center' }}>
            {[1,2,3].map(s => (
              <div key={s} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? '#00ffc8' : 'rgba(255,255,255,0.1)',
                color: step >= s ? '#0f0c29' : '#555',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.8rem', fontWeight:700
              }}>{s}</div>
            ))}
          </div>

          {error   && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          {step === 1 && (
            <form onSubmit={handleEmail}>
              <div className="form-group">
                <label>Registered Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOTP}>
              <div className="form-group">
                <label>Enter OTP (sent to {email})</label>
                <input value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} placeholder="6-digit OTP" />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="Enter new password" />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
