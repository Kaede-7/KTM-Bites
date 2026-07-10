import React from "react";
import { Link } from "react-router-dom";
import "../css/footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer-global">
      <div className="footer-container">
        <div className="footer-top">
          
          {/* Brand Section */}
          <div className="footer-brand-section">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-text">KTMBites</span>
              <span className="footer-logo-dot"></span>
            </Link>
            <p className="footer-tagline">
              Revolutionizing food delivery in Kathmandu with high-speed cravings delivered right to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <Link to="/home">Home</Link>
              <Link to="/menu">Browse Menu</Link>
              <Link to="/about">Our Story</Link>
              <Link to="/contact">Contact Us</Link>
            </div>
          </div>

          {/* Portals */}
          <div className="footer-col">
            <h4>Work With Us</h4>
            <div className="footer-links">
              <Link to="/rider-login">Rider Portal</Link>
              <Link to="/kitchen">Kitchen Login</Link>
              <Link to="/cashier-login">Cashier Login</Link>
              <Link to="/admin">Admin Dashboard</Link>
              <Link to="/rider-signup">Become a Rider</Link>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            © 2026 KTMBites Global. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
