import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/navbar.css";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";
import { isLoggedIn } from "../api/auth";
import { getCart } from "../api/cart";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "active" : "";
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (loggedIn) {
      getCart()
        .then((cart) => setCartCount(cart.item_count))
        .catch(() => setCartCount(0));
    }
  }, [location.pathname, loggedIn]);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/home" className="navbar-logo">
          <img src={transparentLogo} alt="KTM Bites" />
        </Link>

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
        </div>

        <div className="navbar-actions">
          <Link to="/cart" className="navbar-cart-btn">
            <span className="material-symbols-rounded">shopping_cart</span>
            {cartCount > 0 && <span className="navbar-cart-badge">{cartCount}</span>}
          </Link>
          {loggedIn ? (
            <Link to="/profile" className="navbar-profile-btn">
              <span className="material-symbols-rounded">person</span>
            </Link>
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
          <Link to="/profile" className={`navbar-mobile-link ${isActive("/profile")}`} onClick={() => setIsMenuOpen(false)}>
            <span className="material-symbols-rounded">person</span>Profile
          </Link>
          {!loggedIn && (
            <div className="navbar-mobile-actions">
              <Link to="/login" onClick={() => setIsMenuOpen(false)}><button className="navbar-btn-login">Login</button></Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)}><button className="navbar-btn-signup">Sign Up</button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
