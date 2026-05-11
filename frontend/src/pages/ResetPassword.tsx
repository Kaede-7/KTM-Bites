import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../css/auth.css";
import { resetPassword } from "../api/auth";
import { getErrorMessage } from "../utils/errors";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await resetPassword(token, password);
      setMessage("Your password has been successfully reset. You can now log in.");
      // Automatically redirect after a short delay
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to reset password. The link might be expired."));
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return <div className="auth-form-container">Loading...</div>;
  }

  return (
    <div className="auth-form-container auth-fade-in">
      <h1>Reset Password</h1>
      <p className="auth-subtitle">
        Enter your new password below.
      </p>

      {message && (
        <div className="auth-error" style={{ background: 'rgba(96, 187, 70, 0.1)', color: '#2e7d32' }}>
          <span className="material-symbols-rounded">check_circle</span>
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
          <span className="material-symbols-rounded">lock</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || !!message || !token}
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

        <div className="auth-input-wrapper" style={{ marginTop: '16px' }}>
          <span className="material-symbols-rounded">lock_reset</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading || !!message || !token}
          />
        </div>

        <button 
          type="submit" 
          className="auth-submit-btn" 
          disabled={loading || !!message || !token}
          style={{ marginTop: '16px' }}
        >
          {loading ? "Resetting..." : "Set New Password"}
        </button>

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          <Link to="/login">Back to Login</Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
