/**
 * pages/Landing.js
 * Public landing page — entry point of the app.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />
      <div className="landing-wrap">
        <div className="landing-card">
          <h1>Signature Verification</h1>
          <h2>Using Siamese Neural Network</h2>
          <p>
            Authenticate and verify handwritten signatures using deep learning.
            Our Siamese Network compares two signatures and determines if they match
            with high accuracy.
          </p>
          <div className="landing-actions">
            <button onClick={() => navigate('/register')} className="btn-primary">
              Get Started
            </button>
            <button onClick={() => navigate('/login')} className="btn-outline">
              Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
