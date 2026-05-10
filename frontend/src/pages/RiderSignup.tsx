import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css";
import { register, googleLogin } from "../api/auth";
import { useGoogleLogin } from "@react-oauth/google";

const RiderSignup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: 'RIDER'
      });
      navigate("/rider");
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData) {
        const firstError = Object.values(errData).flat()[0];
        setError(typeof firstError === "string" ? firstError : "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await googleLogin(tokenResponse.access_token, true, 'RIDER');
        navigate("/rider");
      } catch (err: any) {
        setError("Google signup failed. Please try again.");
      }
    },
    onError: () => setError("Google signup failed."),
  });

  return (
    <div className="auth-form-container auth-fade-in">
      <div className="auth-badge-rider">RIDER PORTAL</div>
      <h1>Partner with KTM Bites</h1>
      <p className="auth-subtitle">Deliver joy across Kathmandu and earn on your own schedule.</p>

      <div className="auth-tabs-modern">
        <Link to="/rider-login" className="auth-tab-modern">Sign In</Link>
        <Link to="/rider-signup" className="auth-tab-modern active">Signup</Link>
      </div>

      {error && (
        <div className="auth-error">
          <span className="material-symbols-rounded">error</span>
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-input-wrapper">
          <span className="material-symbols-rounded">person</span>
          <input type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange("fullName")} required />
        </div>

        <div className="auth-input-wrapper">
          <span className="material-symbols-rounded">mail</span>
          <input type="email" placeholder="Email Address" value={formData.email} onChange={handleChange("email")} required />
        </div>

        <div className="auth-input-wrapper">
          <span className="material-symbols-rounded">lock</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange("password")}
            required
          />
          <button type="button" className="auth-toggle-password" onClick={() => setShowPassword(!showPassword)}>
            <span className="material-symbols-rounded">{showPassword ? "visibility" : "visibility_off"}</span>
          </button>
        </div>

        <div className="auth-input-wrapper" style={{ marginBottom: "8px" }}>
          <span className="material-symbols-rounded">lock</span>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            required
          />
          <button type="button" className="auth-toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            <span className="material-symbols-rounded">{showConfirmPassword ? "visibility" : "visibility_off"}</span>
          </button>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? "Registering..." : "Become a Rider"}
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="auth-google-btn-wrapper">
          <button type="button" className="auth-google-override" onClick={() => loginWithGoogle()}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
            Sign Up with Google
          </button>
        </div>

        <div className="auth-footer">
          Already a rider? <Link to="/rider-login">Log In here</Link>
        </div>
      </form>
    </div>
  );
};

export default RiderSignup;
