/**
 * components/Spinner.js
 * Reusable loading spinner shown during API calls.
 */
import React from 'react';
import './Spinner.css';

export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
