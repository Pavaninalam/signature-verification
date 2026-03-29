/**
 * pages/SplashScreen.js
 *
 * Full-screen landing splash shown when the app first loads.
 * Clicking "Verify Signature" fades it out and reveals the main app.
 *
 * Props:
 *   onEnter — callback fired when the button is clicked
 */
import React, { useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onEnter }) {
  const [leaving, setLeaving] = useState(false);

  const handleClick = () => {
    // Trigger fade-out animation, then notify parent
    setLeaving(true);
    setTimeout(onEnter, 600); // matches CSS transition duration
  };

  return (
    <div
      className={`splash-root ${leaving ? 'splash-leave' : ''}`}
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.jpg)` }}
    >
      {/* Dark overlay so text stays readable over any background */}
      <div className="splash-overlay" />

      <div className="splash-content">
        {/* Badge */}
        <div className="splash-badge">Deep Learning · Siamese Network</div>

        {/* Title */}
        <h1 className="splash-title">
          <span className="splash-title-accent">Signature</span>
          <br />Verification System
        </h1>

        {/* Subtitle */}
        <p className="splash-subtitle">
          Authenticate handwritten signatures with AI-powered accuracy.
          <br />
          Upload two signatures — get an instant match result.
        </p>

        {/* CTA button */}
        <button className="splash-btn" onClick={handleClick}>
          <span className="splash-btn-icon">✍️</span>
          Verify Signature
          <span className="splash-btn-arrow">→</span>
        </button>

        {/* Scroll hint */}
        <p className="splash-hint">Powered by Keras · Django REST · React</p>
      </div>
    </div>
  );
}
