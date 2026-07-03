import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/navbar.css";
import mascotIcon from "../assets/ktm-bites-transparent-notext.png";
import { isLoggedIn, logout } from "../api/auth";
import { getCart } from "../api/cart";
import NotificationDropdown from "./NotificationDropdown";
import { useCalorie } from "./CalorieTracker";

// ── Calorie Dropdown Panel ─────────────────────────────────────
const CalorieDropdown: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cart, isLoading } = useCalorie();
  const ref = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Still fetching — show spinner
  if (isLoading) {
    return (
      <div className="calorie-dropdown" ref={ref}>
        <div className="cd-arrow" />
        <div className="cd-header">
          <span className="material-symbols-rounded cd-header-icon">local_fire_department</span>
          <span>Calorie Tracker</span>
          <button className="cd-close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        <div className="cd-loading-state">
          <div className="cd-loading-ring" />
          <p>Loading your calorie data…</p>
        </div>
      </div>
    );
  }

  // Fetch finished but no cart or no target set — show CTA
  const isTargetSet = cart !== null && cart.calorie_target !== null;


  // ── "kcal Not Set" CTA panel — shown when target is null ──────
  if (!isTargetSet) {
    return (
      <div className="calorie-dropdown" ref={ref}>
        <div className="cd-arrow" />
        <div className="cd-header">
          <span className="material-symbols-rounded cd-header-icon">local_fire_department</span>
          <span>Calorie Tracker</span>
          <button className="cd-close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Hero CTA */}
        <div className="cd-notset-hero">
          <div className="cd-notset-icon-wrap">
            <span className="material-symbols-rounded cd-notset-fire">local_fire_department</span>
          </div>
          <div className="cd-notset-badge">kcal not set</div>
          <h3 className="cd-notset-title">Track Your Daily Calories</h3>
          <p className="cd-notset-desc">
            Set a daily calorie goal to monitor what you're ordering and stay on top of your health targets — right from your cart.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="cd-notset-features">
          <div className="cd-notset-feature">
            <span className="material-symbols-rounded" style={{ color: '#10b981' }}>show_chart</span>
            <span>Live progress ring as you add items</span>
          </div>
          <div className="cd-notset-feature">
            <span className="material-symbols-rounded" style={{ color: '#f28b46' }}>notifications_active</span>
            <span>Alerts when you're near your limit</span>
          </div>
          <div className="cd-notset-feature">
            <span className="material-symbols-rounded" style={{ color: '#3b82f6' }}>receipt_long</span>
            <span>Breakdown by item in your cart</span>
          </div>
        </div>

        {/* Action */}
        <div className="cd-actions" style={{ padding: '8px 14px 16px' }}>
          <Link to="/profile" className="cd-btn-primary cd-btn-cta" onClick={onClose}>
            <span className="material-symbols-rounded">tune</span>
            Set My Calorie Goal
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.min(cart.calorie_percentage, 100);
  const exceeded = cart.calorie_exceeded;
  const remaining = Math.max(0, (cart.calorie_target as number) - cart.total_calories);

  // SVG ring dimensions
  const size = 110;
  const strokeW = 9;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  // Color based on percentage
  const ringColor = pct < 70 ? "#10b981" : pct < 90 ? "#f28b46" : "#ef4444";
  const ringGlow = pct < 70 ? "rgba(16,185,129,0.18)" : pct < 90 ? "rgba(242,139,70,0.18)" : "rgba(239,68,68,0.18)";
  const bgColor  = pct < 70 ? "rgba(16,185,129,0.06)" : pct < 90 ? "rgba(242,139,70,0.06)" : "rgba(239,68,68,0.06)";

  // Status config
  const statusConfig = exceeded
    ? { icon: "warning", cls: "cd-message-over", text: `${(cart.total_calories - (cart.calorie_target as number)).toLocaleString()} kcal over your daily target` }
    : pct >= 80
    ? { icon: "running_with_errors", cls: "cd-message-warn", text: `${remaining.toLocaleString()} kcal left — approaching your limit` }
    : { icon: "check_circle", cls: "cd-message-ok", text: `${remaining.toLocaleString()} kcal remaining for today` };

  return (
    <div className="calorie-dropdown" ref={ref}>
      <div className="cd-arrow" />

      {/* Header */}
      <div className="cd-header">
        <span className="material-symbols-rounded cd-header-icon">local_fire_department</span>
        <span>Calorie Tracker</span>
        <button className="cd-close" onClick={onClose} aria-label="Close">
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>

      {/* Ring + Stats side-by-side */}
      <div className="cd-top-section" style={{ background: bgColor }}>
        <div className="cd-ring-wrap">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={strokeW} />
            <circle
              cx={size/2} cy={size/2} r={r}
              fill="none" stroke={ringColor}
              strokeWidth={strokeW} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ - dash}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              style={{ transition: "stroke-dashoffset 0.55s cubic-bezier(0.22,1,0.36,1), stroke 0.3s ease", filter: `drop-shadow(0 0 5px ${ringGlow})` }}
            />
          </svg>
          <div className="cd-ring-center">
            <span className="cd-ring-pct" style={{ color: ringColor }}>{Math.round(pct)}%</span>
            <span className="cd-ring-sub">of target</span>
          </div>
        </div>

        <div className="cd-side-stats">
          <div className="cd-side-stat">
            <span className="material-symbols-rounded" style={{ color: "#f28b46", fontSize: "18px" }}>shopping_cart</span>
            <div>
              <div className="cd-side-val">{cart.total_calories.toLocaleString()}</div>
              <div className="cd-side-label">In cart (kcal)</div>
            </div>
          </div>
          <div className="cd-side-stat">
            <span className="material-symbols-rounded" style={{ color: "#6b7280", fontSize: "18px" }}>flag</span>
            <div>
              <div className="cd-side-val">{(cart.calorie_target as number).toLocaleString()}</div>
              <div className="cd-side-label">Daily target</div>
            </div>
          </div>
          <div className="cd-side-stat">
            <span className="material-symbols-rounded" style={{ color: ringColor, fontSize: "18px" }}>
              {exceeded ? "trending_up" : "trending_down"}
            </span>
            <div>
              <div className="cd-side-val" style={{ color: ringColor }}>
                {exceeded ? `+${(cart.total_calories - (cart.calorie_target as number)).toLocaleString()}` : remaining.toLocaleString()}
              </div>
              <div className="cd-side-label">{exceeded ? "Over limit" : "Remaining"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="cd-bar-wrap">
        <div className="cd-bar-track">
          <div className="cd-bar-fill" style={{
            width: `${pct}%`,
            background: pct < 70
              ? "linear-gradient(90deg,#34d399,#10b981)"
              : pct < 90
              ? "linear-gradient(90deg,#fbbf24,#f28b46)"
              : "linear-gradient(90deg,#f28b46,#ef4444)",
          }} />
          <div className="cd-bar-marker" style={{ left: "70%" }} />
          <div className="cd-bar-marker" style={{ left: "90%" }} />
        </div>
        <div className="cd-bar-legend">
          <span><span className="cd-dot" style={{ background: "#10b981" }} />Healthy</span>
          <span><span className="cd-dot" style={{ background: "#f28b46" }} />Moderate</span>
          <span><span className="cd-dot" style={{ background: "#ef4444" }} />Over</span>
        </div>
      </div>

      {/* Cart items breakdown */}
      {cart.items && cart.items.length > 0 && (
        <div className="cd-items">
          <div className="cd-items-header">
            <span className="material-symbols-rounded">receipt_long</span>
            Cart Breakdown
          </div>
          <div className="cd-items-list">
            {cart.items.map(item => {
              const itemPct = (cart.calorie_target as number) > 0 ? Math.round((item.total_calories / (cart.calorie_target as number)) * 100) : 0;
              return (
                <div key={item.id} className="cd-item-row">
                  <div className="cd-item-name">
                    <span className="cd-item-qty">{item.quantity}×</span>
                    <span>{item.name}</span>
                  </div>
                  <div className="cd-item-kcal">
                    <span className="material-symbols-rounded" style={{ fontSize: "13px", color: "#f28b46" }}>local_fire_department</span>
                    {item.total_calories} kcal
                    <span className="cd-item-pct">({itemPct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status pill */}
      <div className={`cd-message ${statusConfig.cls}`}>
        <span className="material-symbols-rounded">{statusConfig.icon}</span>
        {statusConfig.text}
      </div>

      {/* Tip when no items */}
      {cart.items.length === 0 && (
        <div className="cd-empty-hint">
          <span className="material-symbols-rounded">info</span>
          Add items to your cart to start tracking calories
        </div>
      )}

      {/* Actions */}
      <div className="cd-actions">
        <Link to="/cart" className="cd-btn-primary" onClick={onClose}>
          <span className="material-symbols-rounded">shopping_cart</span>
          View Cart
        </Link>
        <Link to="/profile" className="cd-btn-secondary" onClick={onClose}>
          <span className="material-symbols-rounded">tune</span>
          Adjust Target
        </Link>
      </div>
    </div>
  );

};

// ── Navbar ─────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartBumping, setCartBumping] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [calorieOpen, setCalorieOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "active" : "";
  const loggedIn = isLoggedIn("user");

  const { cart } = useCalorie();

  const updateCartCount = useCallback((shouldBump: boolean = false) => {
    if (loggedIn) {
      getCart()
        .then((cart) => {
          setCartCount(cart.item_count);
          if (shouldBump) {
            setCartBumping(true);
            setTimeout(() => setCartBumping(false), 300);
          }
        })
        .catch(() => setCartCount(0));
    }
  }, [loggedIn]);

  useEffect(() => {
    updateCartCount(false);
    const handleCartUpdate = () => updateCartCount(true);
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [updateCartCount]);

  useEffect(() => {
    setNotifOpen(false);
    setCalorieOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleUnreadChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  const handleLogout = () => {
    if (location.pathname.startsWith('/rider')) {
      logout("/rider-login");
    } else {
      logout("/login");
    }
  };

  const isRiderPath = location.pathname.startsWith('/rider');
  const isHiddenPath = ["/login", "/signup", "/admin", "/kitchen", "/rider"].some(p => location.pathname.startsWith(p));
  // Show the calorie icon for any logged-in user on non-hidden paths.
  // We no longer require cart to be loaded — it shows a loading/unset state.
  const showCalorieBtn = loggedIn && !isHiddenPath;

  const caloriePct = cart ? Math.min(cart.calorie_percentage, 100) : 0;
  const calorieColor = caloriePct < 70 ? "#10b981" : caloriePct < 90 ? "#f28b46" : "#ef4444";

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
            <Link to="/groups" className={`navbar-link ${isActive("/groups")}`}>
              <span className="material-symbols-rounded">groups</span>
              Groups
            </Link>
            <Link to="/order-tracking/latest" className={`navbar-link ${isActive("/order-tracking/latest")}`}>
              <span className="material-symbols-rounded">local_shipping</span>
              Track
            </Link>
            <Link to="/about" className={`navbar-link ${isActive("/about")}`}>
              <span className="material-symbols-rounded">info</span>
              About
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
              {/* Calorie tracker button */}
              {showCalorieBtn && (
                <div className="calorie-nav-wrap" style={{ position: 'relative' }}>
                  <button
                    className={`calorie-nav-btn ${cart === null || cart.calorie_target === null ? 'calorie-no-target' : cart.calorie_exceeded ? 'calorie-exceeded' : ''}`}
                    onClick={() => { setCalorieOpen(v => !v); setNotifOpen(false); }}
                    title={cart === null || cart.calorie_target === null ? "kcal not set — tap to set goal" : "Calorie Tracker"}
                    aria-label={cart === null || cart.calorie_target === null ? "Calorie goal not set" : "Calorie Tracker"}
                    aria-expanded={calorieOpen}
                  >

                    <svg width="34" height="34" viewBox="0 0 34 34" className="calorie-nav-ring-svg">
                      <circle cx="17" cy="17" r="12" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
                      <circle
                        cx="17" cy="17" r="12"
                        fill="none" stroke={calorieColor} strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 12}`}
                        strokeDashoffset={cart === null ? `${2 * Math.PI * 12}` : `${2 * Math.PI * 12 * (1 - caloriePct / 100)}`}
                        transform="rotate(-90 17 17)"
                        style={{ transition: "stroke-dashoffset 0.55s ease, stroke 0.3s ease", opacity: cart === null ? 0.3 : 1 }}
                      />
                    </svg>
                    <span className="material-symbols-rounded calorie-nav-icon">local_fire_department</span>
                    {cart?.calorie_exceeded && <span className="calorie-nav-badge">!</span>}
                  </button>
                  <CalorieDropdown isOpen={calorieOpen} onClose={() => setCalorieOpen(false)} />
                </div>
              )}

              <Link to="/cart" className={`navbar-cart-btn ${cartBumping ? 'bump' : ''}`}>
                <span className="material-symbols-rounded">shopping_cart</span>
                {cartCount > 0 && <span className="navbar-cart-badge">{cartCount}</span>}
              </Link>

              {loggedIn && (
                <div className="notif-bell-wrap" style={{ position: 'relative' }}>
                  <button
                    className="notif-bell-btn"
                    onClick={() => { setNotifOpen(v => !v); setCalorieOpen(false); }}
                    title="Notifications"
                    aria-label="Notifications"
                  >
                    <span className="material-symbols-rounded">notifications</span>
                    {unreadCount > 0 && (
                      <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={notifOpen}
                    onToggle={() => setNotifOpen(false)}
                    onUnreadChange={handleUnreadChange}
                  />
                </div>
              )}

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
              <Link to="/groups" className={`navbar-mobile-link ${isActive("/groups")}`} onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-rounded">groups</span>Group Order
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
