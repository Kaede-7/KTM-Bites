import React from 'react';
import '../css/auth-creative.css';

const AuthCreative: React.FC = () => {
  return (
    <div className="auth-creative-container">
      <div className="ac-minimal-content">
        <h2 className="ac-huge-text">Taste.</h2>
        <div className="ac-circle-image">
          <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop&crop=center" alt="Premium Food" />
        </div>
        <p className="ac-minimal-sub">Elevating your everyday dining.</p>
      </div>
    </div>
  );
};

export default AuthCreative;
