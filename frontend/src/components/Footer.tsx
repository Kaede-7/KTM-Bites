import React from "react";
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
          <span>© 2026 KTM Bites. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
