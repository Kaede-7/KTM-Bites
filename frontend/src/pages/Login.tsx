import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";
import { login } from "../api/auth";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/home");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-left">
        <svg className="auth-left-geo" viewBox="0 0 400 600" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="400" y2="600" stroke="#c8841a" strokeWidth="0.5" opacity="0.4" />
          <line x1="400" y1="0" x2="0" y2="600" stroke="#c8841a" strokeWidth="0.5" opacity="0.4" />
          <circle cx="200" cy="300" r="150" fill="none" stroke="#c8841a" strokeWidth="0.5" opacity="0.3" />
          <circle cx="200" cy="300" r="220" fill="none" stroke="#3b82f6" strokeWidth="0.3" opacity="0.2" />
        </svg>
        <div className="auth-left-content">
          <img src={transparentLogo} alt="KTM Bites" className="auth-left-logo" />
          <h2>Welcome Back!</h2>
          <p>Order your favorite food with just a few taps</p>
          <div className="auth-icon-feature">
            <span className="material-symbols-rounded auth-fi-1">restaurant_menu</span>
            <span className="material-symbols-rounded auth-fi-2">shopping_cart</span>
            <span className="material-symbols-rounded auth-fi-3">local_shipping</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-card">
          <Link to="/" className="auth-back-link">
            <span className="material-symbols-rounded">arrow_back</span>
            Back to Home
          </Link>

          <img src={transparentLogo} alt="KTM Bites" className="auth-card-logo" />

          <div className="auth-tabs">
            <button className="auth-tab active">Sign In</button>
            <Link to="/signup" className="auth-tab">Signup</Link>
          </div>

          {error && (
            <div className="auth-error">
              <span className="material-symbols-rounded">error</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">mail</span>
                <input id="login-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">lock</span>
                <input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="auth-toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  <span className="material-symbols-rounded">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              <span className="material-symbols-rounded">login</span>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
