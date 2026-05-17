import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import heraldMap from "../assets/herald_map.png";
import "../css/contact.css";
import PageTransition from "../components/PageTransition";

const Contact: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Basic logic to check if open
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    let open = false;
    if (day >= 1 && day <= 5) { // Mon-Fri
      open = hour >= 10 && hour < 22;
    } else if (day === 6) { // Sat
      open = hour >= 10 && hour < 23;
    } else if (day === 0) { // Sun
      open = hour >= 11 && hour < 21;
    }
    setIsOpen(open);
  }, []);

  const handleCall = () => {
    alert("Call us at: 980000000");
  };

  return (
    <PageTransition>
      <div className="contact-page">
      <Navbar />

      <main className="contact-main">
        <div className="contact-header">
          <h1>Get in Touch</h1>
          <p>We're here to help with your orders, answer your questions, or just say hi.</p>
        </div>

        <div className="contact-content">
          <div className="contact-left">
            <div className="contact-card support-card">
              <h2>Order Support</h2>
              <p>Have an active order? Give us a call directly to the restaurant for the fastest resolution.</p>
              <button className="contact-btn" onClick={handleCall}>
                <span className="material-symbols-rounded">call</span>
                Call Restaurant
              </button>
            </div>

            <div className="contact-card hours-card">
              <div className="hours-header">
                <h2>Hours</h2>
                <span className={`hours-badge ${isOpen ? "open" : "closed"}`}>
                  <span className="dot"></span>
                  {isOpen ? "Open Now" : "Closed"}
                </span>
              </div>
              
              <div className="hours-list">
                <div className="hours-row">
                  <span className="day">Monday - Friday</span>
                  <span className="time">10:00 AM - 10:00 PM</span>
                </div>
                <div className="hours-row">
                  <span className="day">Saturday</span>
                  <span className="time">10:00 AM - 11:00 PM</span>
                </div>
                <div className="hours-row">
                  <span className="day">Sunday</span>
                  <span className="time">11:00 AM - 9:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-right">
            <div className="contact-card find-us-card">
              <h2>Find Us</h2>
              <p className="address">Herald College Kathmandu</p>
              
              <div className="map-container">
                <img 
                  src={heraldMap} 
                  alt="Herald College Kathmandu Map" 
                  className="map-image"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </PageTransition>
  );
};

export default Contact;
