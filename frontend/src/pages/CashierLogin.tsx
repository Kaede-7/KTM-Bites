import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/auth.css";
import { cashierLogin } from "../api/cashier";

const CashierLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await cashierLogin(email.trim(), password, rememberMe);
      navigate("/cashier");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container auth-fade-in">
      <div className="auth-badge-cashier">CASHIER PORTAL</div>
      <h1>Cashier Login</h1>
      <p className="auth-subtitle">Sign in to your counter to ring up orders and take payment.</p>

      {error && (
        <div className="auth-error">
          <span className="material-symbols-rounded">error</span>
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-input-wrapper">
          <span className="material-symbols-rounded">badge</span>
          <input
            type="email"
            placeholder="Cashier Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="auth-input-wrapper">
          <span className="material-symbols-rounded">lock</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="auth-toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-symbols-rounded">
              {showPassword ? "visibility" : "visibility_off"}
            </span>
          </button>
        </div>

        <div className="auth-options-row">
          <label className="auth-remember-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Keep me signed in on this terminal
          </label>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? "Signing In..." : "Open Register"}
        </button>

        <div className="auth-footer">
          Accounts are issued by your store manager.
        </div>
      </form>
    </div>
  );
};

export default CashierLogin;
