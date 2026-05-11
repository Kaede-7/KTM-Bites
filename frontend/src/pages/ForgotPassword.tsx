import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/auth.css";
import { forgotPassword } from "../api/auth";
import { getErrorMessage } from "../utils/errors";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setMessage(res.message || "Password reset link sent to your email.");
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to send reset link. Please check the email and try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container auth-fade-in">
      <h1>Forgot Password?</h1>
      <p className="auth-subtitle">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {message && (
        <div className="auth-error" style={{ background: 'rgba(96, 187, 70, 0.1)', color: '#2e7d32' }}>
          <span className="material-symbols-rounded">mark_email_read</span>
          {message}
        </div>
      )}

      {error && (
        <div className="auth-error">
          <span className="material-symbols-rounded">error</span>
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-input-wrapper">
          <span className="material-symbols-rounded">mail</span>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || !!message}
          />
        </div>

        <button 
          type="submit" 
          className="auth-submit-btn" 
          disabled={loading || !!message}
          style={{ marginTop: '12px' }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          Remembered your password? <Link to="/login">Back to Login</Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
