import React from "react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import aboutHero from "../assets/about_hero.png";
import deliveryMap from "../assets/delivery_map.png";
import "../css/about.css";

const About: React.FC = () => {
  return (
    <PageTransition>
      <div className="about-page">
      <Navbar />

      <main className="about-main">
        {/* HERO SECTION */}
        <section className="about-hero">
          <div className="about-hero-text">
            <span className="about-tagline">OUR ROOTS</span>
            <h1>Born in Naxal.<br />Built for Kathmandu.</h1>
            <p>
              What started as a small kitchen experiment in the heart of Jhamsikhel has evolved into Kathmandu's premier destination for curated food delivery. We realized the city craved not just food, but an experience—quality ingredients, authentic local flavors, and a service that truly cares.
            </p>
            <p>
              Our mission is simple: to connect the vibrant culinary pulse of Kathmandu with your dining table, ensuring every bite tells a story of local impact and uncompromising quality.
            </p>
          </div>
          <div className="about-hero-image-container">
            <div className="about-hero-circle">
              <img src={aboutHero} alt="KTM Bites Kitchen" />
              <div className="about-badge badge-top-right">
                <span className="material-symbols-rounded">restaurant</span>
                Premium Quality
              </div>
              <div className="about-badge badge-bottom-left">
                <span className="material-symbols-rounded">local_pizza</span>
                Local Flavors
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="about-how-it-works">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Three simple steps to culinary joy.</p>
          </div>
          <div className="how-it-works-grid">
            <div className="how-card">
              <div className="how-icon-wrapper icon-green">
                <span className="material-symbols-rounded">search</span>
              </div>
              <h3>1. Browse</h3>
              <p>Explore curated menus from Kathmandu's finest hidden gems and local favorites.</p>
            </div>
            <div className="how-card">
              <div className="how-icon-wrapper icon-orange">
                <span className="material-symbols-rounded">account_balance_wallet</span>
              </div>
              <h3>2. Order</h3>
              <p>Pay securely using your preferred local payment methods with absolute peace of mind.</p>
            </div>
            <div className="how-card">
              <div className="how-icon-wrapper icon-purple">
                <span className="material-symbols-rounded">location_on</span>
              </div>
              <h3>3. Track</h3>
              <p>Watch your food journey with live GPS tracking right to your doorstep.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION */}
        <section className="about-bottom-grid">
          <div className="about-card payments-card">
            <h2>Trusted Payments</h2>
            <p>We prioritize your security and convenience. We've seamlessly integrated with Nepal's leading digital wallets for a frictionless checkout experience.</p>
            <div className="payment-pills">
              <div className="payment-pill">
                <span className="pill-dot khalti"></span>
                <strong>Khalti Digital Wallet</strong>
                <span className="pill-sub">Secure, one-tap payments.</span>
              </div>
              <div className="payment-pill">
                <span className="pill-dot kharcha"></span>
                <strong>Kharcha Wallet</strong>
                <span className="pill-sub">Fast & secure linked payments.</span>
              </div>
            </div>
          </div>

          <div className="about-card delivery-zones-card">
            <h2>Our Delivery Zones</h2>
            <p>Currently serving premium neighborhoods to ensure speed and quality. Expansion coming soon.</p>
            <div className="delivery-map-container">
              <img src={deliveryMap} alt="Delivery Zones Map" />
            </div>
            <div className="zone-pills">
              <span className="zone-pill"><span className="dot"></span>Jhamsikhel</span>
              <span className="zone-pill"><span className="dot"></span>Sanepa</span>
              <span className="zone-pill"><span className="dot"></span>Patan</span>
              <span className="zone-pill"><span className="dot"></span>Kupondole</span>
            </div>
          </div>
        </section>
      </main>
      </div>
    </PageTransition>
  );
};

export default About;
