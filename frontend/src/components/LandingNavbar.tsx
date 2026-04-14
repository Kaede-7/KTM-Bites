import React from "react";
import { Link } from "react-router-dom";
import "../css/landing-navbar.css";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";

const LandingNavbar: React.FC = () => {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-content">
        <Link to="/" className="landing-nav-logo">
          <img src={transparentLogo} alt="KTM Bites" />
        </Link>
        <div className="landing-nav-actions">
          <Link to="/login"><button className="landing-nav-btn-login">Login</button></Link>
          <Link to="/signup"><button className="landing-nav-btn-signup">Sign Up</button></Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
