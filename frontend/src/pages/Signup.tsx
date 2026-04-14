import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";
import { register } from "../api/auth";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
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
        phone: formData.phone,
        password: formData.password,
      });
      navigate("/home");
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData) {
        const firstError = Object.values(errData).flat()[0];
        setError(typeof firstError === 'string' ? firstError : "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
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
          <h2>Join KTM Bites!</h2>
          <p>Create your account and start ordering</p>
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
            <Link to="/login" className="auth-tab">Sign In</Link>
            <button className="auth-tab active">Signup</button>
          </div>

          {error && (
            <div className="auth-error">
              <span className="material-symbols-rounded">error</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="signup-name">Full Name</label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">person</span>
                <input id="signup-name" type="text" placeholder="Your full name" value={formData.fullName} onChange={handleChange("fullName")} required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email</label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">mail</span>
                <input id="signup-email" type="email" placeholder="your@email.com" value={formData.email} onChange={handleChange("email")} required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-phone">Phone Number</label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">call</span>
                <input id="signup-phone" type="tel" placeholder="+977-98XXXXXXXX" value={formData.phone} onChange={handleChange("phone")} required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">lock</span>
                <input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={formData.password} onChange={handleChange("password")} required />
                <button type="button" className="auth-toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  <span className="material-symbols-rounded">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">lock</span>
                <input id="signup-confirm" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange("confirmPassword")} required />
                <button type="button" className="auth-toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <span className="material-symbols-rounded">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              <span className="material-symbols-rounded">person_add</span>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
