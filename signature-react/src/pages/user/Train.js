/**
 * pages/user/Train.js
 * Trigger training simulation — shows metrics + graphs.
 */
import React, { useState } from 'react';
import { simulateTrain } from '../../services/api';
import UserSidebar from '../../components/UserSidebar';
import Spinner from '../../components/Spinner';
import './UserLayout.css';

export default function Train() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Graph base: same origin when served by Django, or explicit backend in dev
  const graphBase = window.location.port === '3000'
    ? 'http://localhost:8000'
    : window.location.origin;

  const handleTrain = async () => {
    setError(''); setData(null); setLoading(true);
    try {
      const res = await simulateTrain();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Training simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-layout">
      <UserSidebar />
      <main className="user-main">
        <div className="page-header">
          <h1>🧠 Training Simulation</h1>
          <p>Simulate model training and view performance metrics</p>
        </div>

        <div className="train-card">
          {error && (
            <div style={{ background:'rgba(255,80,80,0.15)', color:'#ff6b6b', padding:'0.75rem 1rem', borderRadius:'8px', marginBottom:'1rem', border:'1px solid rgba(255,80,80,0.3)' }}>
              {error}
            </div>
          )}

          {!data && !loading && (
            <div style={{ textAlign:'center', padding:'2rem 0' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🖊️</div>
              <p style={{ color:'#aaa', marginBottom:'1.5rem' }}>
                Click the button below to run the training simulation.<br />
                This will load the dataset and compute evaluation metrics.
              </p>
              <button
                onClick={handleTrain}
                style={{
                  padding:'0.85rem 2.5rem',
                  background:'linear-gradient(135deg, #00ffc8, #00b4d8)',
                  color:'#0f0c29', border:'none', borderRadius:'10px',
                  fontSize:'1rem', fontWeight:700, cursor:'pointer'
                }}
              >
                Start Training Simulation
              </button>
            </div>
          )}

          {loading && <Spinner text="Running simulation... this may take a moment." />}

          {data && (
            <>
              <div className="dataset-info">
                <div><strong>Genuine Signatures Path:</strong> {data.dataset_paths?.genuine_path}</div>
                <div><strong>Forged Signatures Path:</strong>  {data.dataset_paths?.forged_path}</div>
              </div>

              <h3 style={{ color:'#00ffc8', marginBottom:'0.5rem' }}>📈 Evaluation Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-box">
                  <div className="metric-value">{(data.accuracy * 100).toFixed(2)}%</div>
                  <div className="metric-label">Accuracy</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{(data.precision * 100).toFixed(2)}%</div>
                  <div className="metric-label">Precision</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{(data.recall * 100).toFixed(2)}%</div>
                  <div className="metric-label">Recall</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{(data.auc * 100).toFixed(2)}%</div>
                  <div className="metric-label">AUC</div>
                </div>
              </div>

              <h3 style={{ color:'#00ffc8', marginBottom:'0.5rem' }}>📊 Performance Graphs</h3>
              <div className="graphs-row">
                <div>
                  <p>Confusion Matrix</p>
                  <img src={`${graphBase}/django-static/confusion_matrix.png`} alt="Confusion Matrix" />
                </div>
                <div>
                  <p>Training Graph</p>
                  <img src={`${graphBase}/django-static/training_graph.png`} alt="Training Graph" />
                </div>
              </div>

              <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
                <button
                  onClick={handleTrain}
                  style={{
                    padding:'0.6rem 1.5rem',
                    background:'transparent', color:'#00ffc8',
                    border:'1px solid #00ffc8', borderRadius:'8px',
                    cursor:'pointer', fontSize:'0.9rem'
                  }}
                >
                  🔄 Run Again
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
