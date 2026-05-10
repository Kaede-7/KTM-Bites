import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css";
import { login, googleLogin } from "../api/auth";
import { useGoogleLogin } from "@react-oauth/google";

const RiderLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate("/rider");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // We pass 'RIDER' role to ensure if they are signing up via login page, they get the right role
        await googleLogin(tokenResponse.access_token, true, 'RIDER');
        navigate("/rider");
      } catch (err: any) {
        setError("Google login failed. Please try again.");
      }
    },
    onError: () => setError("Google login failed."),
  });

  return (
    <div className="auth-form-container auth-fade-in">
      <div className="auth-badge-rider">RIDER PORTAL</div>
      <h1>Rider Login</h1>
      <p className="auth-subtitle">Access your delivery dashboard and start earning.</p>

      <div className="auth-tabs-modern">
        <Link to="/rider-login" className="auth-tab-modern active">Sign In</Link>
        <Link to="/rider-signup" className="auth-tab-modern">Signup</Link>
      </div>

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
            placeholder="Rider Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Remember me
          </label>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? "Logging In..." : "Log In to Dashboard"}
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="auth-google-btn-wrapper">
          <button type="button" className="auth-google-override" onClick={() => loginWithGoogle()}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
            Continue with Google
          </button>
        </div>

        <div className="auth-footer">
          Not a rider yet? <Link to="/rider-signup">Sign up here</Link>
        </div>
      </form>
    </div>
  );
};

export default RiderLogin;
