import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import AuthCreative from './AuthCreative';
import '../css/auth.css';

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-page">
      {/* Left Panel - Dynamic Form (Login/Signup) */}
      <div className="auth-left">
        <Link to="/" className="auth-back-btn">
          <span className="material-symbols-rounded">arrow_back</span>
          Back to Home
        </Link>
        <Outlet />
      </div>

      {/* Right Panel - Persistent Static Creative */}
      <div className="auth-right">
        <AuthCreative />
      </div>
    </div>
  );
};

export default AuthLayout;
