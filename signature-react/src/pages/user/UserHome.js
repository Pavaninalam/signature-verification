/**
 * pages/user/UserHome.js
 * User dashboard — shown after login.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../services/api';
import UserSidebar from '../../components/UserSidebar';
import './UserLayout.css';

export default function UserHome() {
  const user = getUser();
  const navigate = useNavigate();

  return (
    <div className="user-layout">
      <UserSidebar />
      <main className="user-main">
        <div className="page-header">
          <h1>Welcome, {user?.name || 'User'} 👋</h1>
          <p>Online Signature Verification System — powered by Deep Learning</p>
        </div>

        <div className="card-grid">
          <div className="feature-card" onClick={() => navigate('/user/predict')}>
            <div className="card-icon">🔍</div>
            <h3>Verify Signature</h3>
            <p>Upload two signature images and check if they match using our Siamese Neural Network.</p>
            <button className="card-btn">Start Verification →</button>
          </div>

          <div className="feature-card" onClick={() => navigate('/user/train')}>
            <div className="card-icon">🧠</div>
            <h3>Train Model</h3>
            <p>Run a training simulation and view accuracy, precision, recall, AUC, and performance graphs.</p>
            <button className="card-btn">View Training →</button>
          </div>
        </div>

        <div className="info-card">
          <h3>How It Works</h3>
          <ol>
            <li>Upload an <strong>original</strong> signature image</li>
            <li>Upload a <strong>test</strong> signature to compare</li>
            <li>The Siamese Network computes the <strong>Euclidean distance</strong></li>
            <li>Distance &lt; 0.5 → <span style={{color:'#00ffc8'}}>Match ✅</span> &nbsp; Distance ≥ 0.5 → <span style={{color:'#ff6b6b'}}>No Match ❌</span></li>
          </ol>
        </div>
      </main>
    </div>
  );
}
