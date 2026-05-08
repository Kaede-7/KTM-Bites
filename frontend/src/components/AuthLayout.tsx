import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthCreative from './AuthCreative';
import '../css/auth.css';

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-page">
      {/* Left Panel - Dynamic Form (Login/Signup) */}
      <div className="auth-left">
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
