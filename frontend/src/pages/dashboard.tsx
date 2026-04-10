import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/dashboard.css";
import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";

interface Stat {
  value: string;
  label: string;
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

const LandingPage: React.FC = () => {
  const [location, setLocation] = useState<string>("");

  const stats: Stat[] = [
    { value: "50+", label: "Menu Items" },
    { value: "30 min", label: "Avg Delivery" },
    { value: "4.9 ★", label: "Rating" },
  ];

  const features: Feature[] = [
    { icon: "restaurant_menu", title: "Browse Full Menu", desc: "Explore categories, item photos, prices and descriptions" },
    { icon: "payments", title: "Easy Payment", desc: "Pay securely via eSewa or Khalti in seconds" },
    { icon: "location_on", title: "Live Tracking", desc: "Follow your order from kitchen to your doorstep" },
  ];

  return (
    <div className="ktm-container">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="ktm-hero">
        <div className="ktm-hero-left">
          <svg className="ktm-hero-geo" viewBox="0 0 400 580" preserveAspectRatio="none">
            <line x1="80" y1="0" x2="320" y2="580" stroke="#C8841A" strokeWidth="1" />
            <line x1="0" y1="120" x2="400" y2="400" stroke="#C8841A" strokeWidth="1" />
            <rect x="60" y="60" width="280" height="400" fill="none" stroke="#C8841A" strokeWidth="1" />
          </svg>

          <div className="ktm-float-img ktm-float-1">
            <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop&crop=center" alt="Delicious pizza" className="ktm-float-photo" />
          </div>
          <div className="ktm-float-img ktm-float-2">
            <img src="https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop&crop=center" alt="Fresh dumplings" className="ktm-float-photo" />
          </div>
          <div className="ktm-float-img ktm-float-3">
            <img src="https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop&crop=center" alt="Smoothie bowl" className="ktm-float-photo" />
          </div>
        </div>

        <div className="ktm-hero-right">
          <div className="ktm-hero-content">
            <h1 className="ktm-hero-title">Craving Something?</h1>
            <p className="ktm-hero-subtitle">Let's get you started !</p>

            <div className="ktm-search-box">
              <div className="ktm-input-wrapper">
                <span className="material-symbols-rounded ktm-input-icon">location_on</span>
                <input
                  type="text"
                  placeholder="Let us know the location."
                  value={location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                  className="ktm-input"
                />
              </div>
              <button className="ktm-btn-primary">
                <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>search</span>
                Search
              </button>
            </div>

            <div className="ktm-stats">
              {stats.map((stat: Stat, index: number) => (
                <React.Fragment key={stat.label}>
                  <div className="ktm-stat">
                    <div className="ktm-stat-value">{stat.value}</div>
                    <div className="ktm-stat-label">{stat.label}</div>
                  </div>
                  {index < stats.length - 1 && <div className="ktm-stat-divider" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="ktm-features">
        <div className="ktm-features-container">
          <h2 className="ktm-section-title">What we offer</h2>
          <div className="ktm-features-grid">
            {features.map((feature: Feature) => (
              <div key={feature.title} className="ktm-feature-card">
                <div className="ktm-feature-icon">
                  <span className="material-symbols-rounded">{feature.icon}</span>
                </div>
                <h3 className="ktm-feature-title">{feature.title}</h3>
                <p className="ktm-feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="ktm-cta">
        <div className="ktm-cta-container">
          <h2 className="ktm-cta-title">Ready to Order?</h2>
          <p className="ktm-cta-text">Browse our full menu and get your food delivered in 30 minutes or less!</p>
          <div className="ktm-cta-actions">
            <Link to="/signup" className="ktm-cta-btn-primary">
              <span className="material-symbols-rounded">person_add</span>
              Create Account
            </Link>
            <Link to="/login" className="ktm-cta-btn-secondary">
              <span className="material-symbols-rounded">login</span>
              Login
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
