import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/navbar.css";
import mascotIcon from "../assets/ktm-bites-transparent-notext.png";
import { isLoggedIn, logout } from "../api/auth";
import { getCart } from "../api/cart";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "active" : "";
  const loggedIn = isLoggedIn();

  const handleLogout = () => {
    if (location.pathname.startsWith('/rider')) {
      logout("/rider-login");
    } else {
      logout("/login");
    }
  };

  useEffect(() => {
    if (loggedIn) {
      getCart()
        .then((cart) => setCartCount(cart.item_count))
        .catch(() => setCartCount(0));
    }
  }, [location.pathname, loggedIn]);

  const isRiderPath = location.pathname.startsWith('/rider');

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to={isRiderPath ? "/rider" : "/"} className="navbar-logo">
          <img src={mascotIcon} alt="" className="navbar-logo-icon" />
          <span className="navbar-logo-wordmark">KTM<em>Bites</em></span>
        </Link>

        {isRiderPath ? (
          <div className="navbar-links">
            <Link to="/rider" className={`navbar-link ${isActive("/rider")}`}>
              <span className="material-symbols-rounded">dashboard</span>
              Dashboard
            </Link>
            <Link to="/rider/profile" className={`navbar-link ${isActive("/rider/profile")}`}>
              <span className="material-symbols-rounded">account_circle</span>
              Profile
            </Link>
          </div>
        ) : (
          <div className="navbar-links">
            <Link to="/home" className={`navbar-link ${isActive("/home")}`}>
              <span className="material-symbols-rounded">home</span>
              Home
            </Link>
            <Link to="/menu" className={`navbar-link ${isActive("/menu")}`}>
              <span className="material-symbols-rounded">restaurant_menu</span>
              Menu
            </Link>
            <Link to="/order-tracking/latest" className={`navbar-link ${isActive("/order-tracking/latest")}`}>
              <span className="material-symbols-rounded">local_shipping</span>
              Track Order
            </Link>
            <Link to="/about" className={`navbar-link ${isActive("/about")}`}>
              <span className="material-symbols-rounded">info</span>
              About Us
            </Link>
            <Link to="/contact" className={`navbar-link ${isActive("/contact")}`}>
              <span className="material-symbols-rounded">call</span>
              Contact
            </Link>
          </div>
        )}

        <div className="navbar-actions">
          {!isRiderPath && (
            <>
              <Link to="/cart" className="navbar-cart-btn">
                <span className="material-symbols-rounded">shopping_cart</span>
                {cartCount > 0 && <span className="navbar-cart-badge">{cartCount}</span>}
              </Link>
              <span className="navbar-divider" />
            </>
          )}
          {loggedIn ? (
            <>
              {!isRiderPath && (
                <Link to="/profile" className="navbar-profile-btn" title="Profile">
                  <span className="material-symbols-rounded">person</span>
                </Link>
              )}
              <button className="navbar-logout-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
                <span className="material-symbols-rounded">logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login"><button className="navbar-btn-login">Login</button></Link>
              <Link to="/signup"><button className="navbar-btn-signup">Sign Up</button></Link>
            </>
          )}
        </div>

        <button className="navbar-mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          <span className="material-symbols-rounded">{isMenuOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {isMenuOpen && (
        <div className="navbar-mobile-menu">
          {isRiderPath ? (
            <>
              <Link to="/rider" className={`navbar-mobile-link ${isActive("/rider")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">dashboard</span>Dashboard
              </Link>
              <Link to="/rider/profile" className={`navbar-mobile-link ${isActive("/rider/profile")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">account_circle</span>Profile
              </Link>
              <button className="navbar-mobile-link" onClick={() => { handleLogout(); setIsMenuOpen(false); }} style={{ color: "#ef4444", width: "100%", textAlign: "left", cursor: "pointer" }}>
                <span className="material-symbols-rounded">logout</span>Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/home" className={`navbar-mobile-link ${isActive("/home")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">home</span>Home
              </Link>
              <Link to="/menu" className={`navbar-mobile-link ${isActive("/menu")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">restaurant_menu</span>Menu
              </Link>
              <Link to="/cart" className={`navbar-mobile-link ${isActive("/cart")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">shopping_cart</span>Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link to="/order-tracking/latest" className={`navbar-mobile-link`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">local_shipping</span>Track Order
              </Link>
              <Link to="/about" className={`navbar-mobile-link ${isActive("/about")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">info</span>About Us
              </Link>
              <Link to="/contact" className={`navbar-mobile-link ${isActive("/contact")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">call</span>Contact
              </Link>
              <Link to="/profile" className={`navbar-mobile-link ${isActive("/profile")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">person</span>Profile
              </Link>
              {!loggedIn ? (
                <div className="navbar-mobile-actions">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}><button className="navbar-btn-login">Login</button></Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}><button className="navbar-btn-signup">Sign Up</button></Link>
                </div>
              ) : (
                <button className="navbar-mobile-link" onClick={() => { handleLogout(); setIsMenuOpen(false); }} style={{ color: "#ef4444", width: "100%", textAlign: "left", cursor: "pointer" }}>
                  <span className="material-symbols-rounded">logout</span>Logout
                </button>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
