import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/auth.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import AuthCreative from "../components/AuthCreative";
import { login as authLogin, logout as authLogout, getStoredUser, getToken } from "../api/auth";
import { fetchKitchenOrders, updateOrderStatus, type KitchenOrder } from "../api/kitchen";

const Rider: React.FC = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [riderUser, setRiderUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Dashboard state
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Restore session from saved token
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (token && user && (user.is_staff || user.is_superuser)) {
      setRiderUser(user);
      setIsLoggedIn(true);
    }
  }, []);

  // Load orders
  const loadOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchKitchenOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (!isLoggedIn) return;
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const response = await authLogin(email, password, rememberMe);
      if (!response.user.is_staff && !response.user.is_superuser) {
        authLogout();
        throw new Error("Access denied. Rider staff credentials required.");
      }
      setRiderUser(response.user);
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRiderUser(null);
    setOrders([]);
    setEmail("");
    setPassword("");
    authLogout();
  };

  // Order actions
  const handlePickup = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, "on_way");
      await loadOrders();
    } catch (err: any) {
      console.error("Pickup failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDrop = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, "delivered");
      await loadOrders();
    } catch (err: any) {
      console.error("Drop failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Categorize orders
  const availableOrders = orders.filter((o) => o.status === "ready_for_pickup");
  const pickedOrders = orders.filter((o) => o.status === "on_way");
  const droppedOrders = orders.filter((o) => o.status === "delivered");

  // ══════════════════════════════════════════
  // LOGIN VIEW
  // ══════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-form-container auth-fade-in">
            <h1>Rider Portal</h1>
            <p className="auth-subtitle">Sign in to manage your deliveries.</p>

            <div className="auth-promise-badge">
              <span className="material-symbols-rounded">two_wheeler</span>
              Rider Staff Only
            </div>

            {loginError && (
              <div className="auth-error">
                <span className="material-symbols-rounded">error</span>
                {loginError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">mail</span>
                <input
                  type="email"
                  placeholder="rider@ktmbites.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-rounded">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              <div className="auth-options-row">
                <label className="auth-remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loginLoading}>
                {loginLoading ? "Signing In..." : "Enter Portal"}
              </button>

              <div className="auth-footer" style={{ marginTop: '2rem' }}>
                <Link to="/">← Back to Home</Link>
              </div>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#8b7d72' }}>
              <p>Demo: rider@ktmbites.com / rider123</p>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <AuthCreative />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // DASHBOARD VIEW
  // ══════════════════════════════════════════
  return (
    <div className="rider-page">
      <Navbar />

      <div className="rider-container">
        {/* Top Bar */}
        <div className="rider-topbar">
          <div className="rider-topbar-left">
            <h1>Delivery Dashboard</h1>
            <p>Real-time metrics for today, {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.</p>
          </div>
          <div className="rider-topbar-actions">
            <button
              className="rider-refresh-btn"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
            >
              <span className="material-symbols-rounded">refresh</span>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="rider-stats">
          <div className="rider-stat-card">
            <div className="rider-stat-icon orange">
              <span className="material-symbols-rounded">storefront</span>
            </div>
            <div className="rider-stat-label">Available Orders</div>
            <div className="rider-stat-value">{availableOrders.length}</div>
            <span className="rider-stat-badge orange">Ready for pickup</span>
          </div>
          <div className="rider-stat-card">
            <div className="rider-stat-icon blue">
              <span className="material-symbols-rounded">two_wheeler</span>
            </div>
            <div className="rider-stat-label">Picked Up</div>
            <div className="rider-stat-value">{pickedOrders.length}</div>
            <span className="rider-stat-badge blue">In transit</span>
          </div>
          <div className="rider-stat-card">
            <div className="rider-stat-icon green">
              <span className="material-symbols-rounded">check_circle</span>
            </div>
            <div className="rider-stat-label">Delivered</div>
            <div className="rider-stat-value">{droppedOrders.length}</div>
            <span className="rider-stat-badge green">Completed</span>
          </div>
        </div>

        {loading ? (
          <LoadingAnimation message="Loading deliveries..." />
        ) : (
          <>
            {/* Available for Pickup */}
            <div className="rider-section">
              <div className="rider-section-header">
                <h2>Available for Pickup</h2>
                <span className="rider-section-count">{availableOrders.length}</span>
              </div>
              {availableOrders.length === 0 ? (
                <div className="rider-empty">
                  <span className="material-symbols-rounded">hourglass_empty</span>
                  No orders ready for pickup right now.
                </div>
              ) : (
                <div className="rider-orders-grid">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="rider-order-card">
                      <div className="rider-card-header">
                        <span className="rider-card-id">{order.order_id}</span>
                        <span className="rider-card-amount">Rs. {order.total}</span>
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">person</span>
                        {order.full_name}
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">location_on</span>
                        {order.address}, {order.city}
                      </div>
                      {order.phone && (
                        <div className="rider-card-detail">
                          <span className="material-symbols-rounded">call</span>
                          {order.phone}
                        </div>
                      )}
                      <div className="rider-card-actions">
                        <button
                          className="rider-action-btn rider-btn-pickup"
                          onClick={() => handlePickup(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          <span className="material-symbols-rounded">inventory</span>
                          {actionLoading === order.id ? "Picking…" : "Pick Up"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Picked Up — On the Way */}
            <div className="rider-section">
              <div className="rider-section-header">
                <h2>On the Way</h2>
                <span className="rider-section-count">{pickedOrders.length}</span>
              </div>
              {pickedOrders.length === 0 ? (
                <div className="rider-empty">
                  <span className="material-symbols-rounded">two_wheeler</span>
                  No active deliveries. Pick up an order above!
                </div>
              ) : (
                <div className="rider-orders-grid">
                  {pickedOrders.map((order) => (
                    <div key={order.id} className="rider-order-card">
                      <div className="rider-card-header">
                        <span className="rider-card-id">{order.order_id}</span>
                        <span className="rider-card-amount">Rs. {order.total}</span>
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">person</span>
                        {order.full_name}
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">location_on</span>
                        {order.address}, {order.city}
                      </div>
                      {order.phone && (
                        <div className="rider-card-detail">
                          <span className="material-symbols-rounded">call</span>
                          {order.phone}
                        </div>
                      )}
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">payments</span>
                        {order.payment_method.toUpperCase()}
                      </div>
                      <div className="rider-card-actions">
                        <button
                          className="rider-action-btn rider-btn-drop"
                          onClick={() => handleDrop(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          <span className="material-symbols-rounded">done_all</span>
                          {actionLoading === order.id ? "Delivering…" : "Drop Off"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Deliveries */}
            {droppedOrders.length > 0 && (
              <div className="rider-section">
                <div className="rider-section-header">
                  <h2>Completed Today</h2>
                  <span className="rider-section-count">{droppedOrders.length}</span>
                </div>
                <div className="rider-orders-grid">
                  {droppedOrders.map((order) => (
                    <div key={order.id} className="rider-order-card delivered">
                      <div className="rider-card-header">
                        <span className="rider-card-id">{order.order_id}</span>
                        <span className="rider-delivered-badge">
                          <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>check_circle</span>
                          Delivered
                        </span>
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">location_on</span>
                        {order.address}
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">payments</span>
                        Rs. {order.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Rider;
