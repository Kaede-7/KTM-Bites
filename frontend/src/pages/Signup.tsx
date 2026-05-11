import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css";
import { register, googleLogin } from "../api/auth";
import { useGoogleLogin } from "@react-oauth/google";
import AuthCreative from "../components/AuthCreative";

const Signup: React.FC = () => {
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

  const validatePasswordStrength = (password: string) => {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
    return "";
  };

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

    const passwordError = validatePasswordStrength(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      navigate("/home");
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
        await googleLogin(tokenResponse.access_token, true);
        navigate("/home");
      } catch (err: any) {
        setError("Google signup failed. Please try again.");
      }
    },
    onError: () => setError("Google signup failed."),
  });

  return (
    <div className="auth-form-container auth-fade-in">
      <h1>Create Account</h1>
      <p className="auth-subtitle">Join us and start ordering your favorites.</p>

      <div className="auth-promise-badge">
        <span className="material-symbols-rounded">bolt</span>
        Swift Delivery Promise
      </div>

      <div className="auth-tabs-modern">
        <Link to="/login" className="auth-tab-modern">Sign In</Link>
        <Link to="/signup" className="auth-tab-modern active">Signup</Link>
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
        <div className="auth-input-hint">
          Must be 8+ chars with uppercase, number, & special char
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
          {loading ? "Creating Account..." : "Sign Up"}
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
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
