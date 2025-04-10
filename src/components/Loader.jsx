// src/components/Loader.jsx
import React from 'react';

const Loader = () => (
    <div className="loader-container">
        <div className="loader-spinner"></div>
        <style>{`
      .loader-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .loader-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    </div>
);

export default Loader;