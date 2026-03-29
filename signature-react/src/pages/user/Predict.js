/**
 * pages/user/Predict.js
 * Upload two signature images → get match/no-match result from ML model.
 */
import React, { useState } from 'react';
import { predictSignature } from '../../services/api';
import UserSidebar from '../../components/UserSidebar';
import Spinner from '../../components/Spinner';
import './UserLayout.css';

export default function Predict() {
  const [img1, setImg1]       = useState(null);
  const [img2, setImg2]       = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleFile = (setter, previewSetter) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!img1 || !img2) { setError('Please upload both signature images.'); return; }
    setError(''); setResult(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image1', img1);
      fd.append('image2', img2);
      const res = await predictSignature(fd);
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error || '';
      if (status === 401 || status === 403) {
        setError(msg || 'Session expired. Please log out and log in again.');
      } else if (status === 503) {
        setError('⏳ Server is warming up — please wait 10 seconds and try again.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('⏳ Request timed out. Please try again.');
      } else if (!err.response) {
        setError('Cannot reach server. Check your internet connection.');
      } else {
        setError(msg || 'Prediction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isMatch = result?.result === 'Match';

  // Image base: same origin when served by Django, or explicit backend in dev
  const imgBase = window.location.port === '3000'
    ? 'http://localhost:8000'
    : window.location.origin;

  return (
    <div className="user-layout">
      <UserSidebar />
      <main className="user-main">
        <div className="page-header">
          <h1>🔍 Signature Verification</h1>
          <p>Upload two signature images to check if they match</p>
        </div>

        <div className="predict-card">
          {error && (
            <div style={{ background:'rgba(255,80,80,0.15)', color:'#ff6b6b', padding:'0.75rem 1rem', borderRadius:'8px', marginBottom:'1rem', border:'1px solid rgba(255,80,80,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="upload-row">
              <div className="upload-box">
                <label>Original Signature</label>
                <input type="file" accept="image/*" onChange={handleFile(setImg1, setPreview1)} />
                {preview1 && <img src={preview1} alt="Original signature preview" />}
              </div>
              <div className="upload-box">
                <label>Test / Forged Signature</label>
                <input type="file" accept="image/*" onChange={handleFile(setImg2, setPreview2)} />
                {preview2 && <img src={preview2} alt="Test signature preview" />}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width:'100%', padding:'0.85rem',
                background: 'linear-gradient(135deg, #00ffc8, #00b4d8)',
                color:'#0f0c29', border:'none', borderRadius:'10px',
                fontSize:'1rem', fontWeight:700, cursor:'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Analyzing...' : 'Check Match'}
            </button>
          </form>

          {loading && <Spinner text="Analyzing signatures..." />}

          {result && (
            <div className="result-box">
              <div className={`result-label ${isMatch ? 'result-match' : 'result-nomatch'}`}>
                {isMatch ? '✅ Match' : '❌ No Match'}
              </div>

              {/* Confidence badge */}
              <div style={{ textAlign:'center', marginBottom:'1rem' }}>
                <span style={{
                  display:'inline-block',
                  padding:'0.3rem 1rem',
                  borderRadius:'20px',
                  fontSize:'0.85rem',
                  fontWeight:600,
                  background: result.confidence === 'High'
                    ? 'rgba(0,255,200,0.15)' : 'rgba(255,200,0,0.15)',
                  color: result.confidence === 'High' ? '#00ffc8' : '#ffd700',
                  border: `1px solid ${result.confidence === 'High' ? '#00ffc8' : '#ffd700'}`,
                }}>
                  {result.confidence} Confidence
                </span>
              </div>

              {/* Core metrics */}
              <div className="result-meta">
                <span><strong>Similarity Score:</strong> {(result.similarity * 100).toFixed(1)}%</span>
                <span><strong>Distance:</strong> {result.distance}</span>
                <span><strong>Contrastive Loss:</strong> {result.loss}</span>
              </div>

              {/* Detailed metric breakdown */}
              {result.metrics && (
                <div style={{ margin:'1rem 0', padding:'0.75rem 1rem', background:'rgba(255,255,255,0.05)', borderRadius:'8px', fontSize:'0.85rem', color:'#ccc' }}>
                  <div style={{ color:'#00ffc8', fontWeight:600, marginBottom:'0.5rem' }}>📊 Analysis Breakdown</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', textAlign:'center' }}>
                    <div>
                      <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#fff' }}>
                        {(result.metrics.ssim * 100).toFixed(1)}%
                      </div>
                      <div>SSIM Structure</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#fff' }}>
                        {result.metrics.model_available
                          ? result.metrics.model_distance?.toFixed(3)
                          : 'N/A'}
                      </div>
                      <div>Neural Net Distance</div>
                    </div>
                  </div>
                  {!result.metrics.model_available && (
                    <div style={{ marginTop:'0.5rem', color:'#ffd700', fontSize:'0.8rem', textAlign:'center' }}>
                      ⚠ Running in SSIM-only mode
                    </div>
                  )}
                </div>
              )}

              {(result.img1_url || result.img2_url) && (
                <div className="result-images">
                  {result.img1_url && (
                    <div>
                      <p>Signature 1</p>
                      <img src={`${imgBase}${result.img1_url}`} alt="Signature 1" />
                    </div>
                  )}
                  {result.img2_url && (
                    <div>
                      <p>Signature 2</p>
                      <img src={`${imgBase}${result.img2_url}`} alt="Signature 2" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
