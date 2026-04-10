import React from "react";
import { Link } from "react-router-dom";
import "../css/footer.css";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={transparentLogo} alt="KTM Bites" />
            <p>Delicious food delivered to your doorstep in Kathmandu. Fast, fresh, and affordable.</p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/menu">Browse Menu</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
              <li><Link to="/profile">My Profile</Link></li>
              <li><Link to="/order-tracking/latest">Track Order</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Partner With Us</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <ul>
              <li>
                <a href="#" className="footer-contact-item">
                  <span className="material-symbols-rounded">mail</span>
                  ktmbites@email.com
                </a>
              </li>
              <li>
                <a href="#" className="footer-contact-item">
                  <span className="material-symbols-rounded">call</span>
                  +977-98XXXXXXXX
                </a>
              </li>
              <li>
                <a href="#" className="footer-contact-item">
                  <span className="material-symbols-rounded">location_on</span>
                  Kathmandu, Nepal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2025 KTM Bites. All rights reserved.</span>
          <div className="footer-socials">
            <a href="#" className="footer-social-link"><span className="material-symbols-rounded">share</span></a>
            <a href="#" className="footer-social-link"><span className="material-symbols-rounded">tag</span></a>
            <a href="#" className="footer-social-link"><span className="material-symbols-rounded">chat</span></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
