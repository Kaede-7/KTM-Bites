import React from "react";
import { Link } from "react-router-dom";
import "../css/footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer-minimal">
      <div className="footer-minimal-content">
        <div className="footer-minimal-left">
          <span className="footer-minimal-brand">KTMBites</span>
        </div>
        <div className="footer-minimal-right">
          <span>© 2026 KTMBITES GLOBAL. HIGH-SPEED CRAVINGS DELIVERED.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
