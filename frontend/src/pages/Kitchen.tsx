import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/kitchen.css";
import "../css/auth.css";
import LoadingAnimation from "../components/LoadingAnimation";
import AuthCreative from "../components/AuthCreative";
import { Link } from "react-router-dom";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";
import { login as authLogin, logout as authLogout } from "../api/auth";
import {
  fetchKitchenOrders,
  updateOrderStatus,
  type KitchenOrder,
} from "../api/kitchen";

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isUrgent(dateStr: string): boolean {
  const now = new Date();
  const date = new Date(dateStr);
  return now.getTime() - date.getTime() > 15 * 60000; // >15 mins
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// ═══════════════════════════════════════════
// KITCHEN COMPONENT
// ═══════════════════════════════════════════

const Kitchen: React.FC = () => {
  const navigate = useNavigate();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [kitchenUser, setKitchenUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Toast state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // ── Toast helper ──
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Clock ──
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Load orders ──
  const loadOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchKitchenOrders();
      setOrders(data);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Auto-refresh every 30s ──
  useEffect(() => {
    if (!isLoggedIn) return;
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await authLogin(email, password, rememberMe);
      if (!response.user.is_staff && !response.user.is_superuser) {
        authLogout();
        throw new Error("Access denied. Kitchen staff credentials required.");
      }
      setKitchenUser(response.user);
      setIsLoggedIn(true);
    } catch (err: any) {
      showToast(
        "error",
        err.message || "Invalid credentials. Access denied."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Logout ──
  const handleLogout = () => {
    setIsLoggedIn(false);
    setKitchenUser(null);
    setOrders([]);
    setEmail("");
    setPassword("");
    authLogout();
  };

  // ── Update order status ──
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast("success", `Order updated to ${newStatus.replace("_", " ")}`);
      await loadOrders();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update order");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Categorize orders ──
  const newOrders = orders.filter((o) => o.status === "placed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready_for_pickup");

  // ═══════════════════════════════════════════
  // LOGIN VIEW
  // ═══════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        {/* Toast for global messages, though AuthLayout theme uses inline errors usually */}
        {toast && (
          <div className={`kitchen-toast toast-${toast.type}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
            <span className="material-symbols-rounded">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            {toast.msg}
            <button
              className="kitchen-toast-close"
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
        )}

        <div className="auth-left">
          <div className="auth-form-container auth-fade-in">
            <h1>Kitchen Login</h1>
            <p className="auth-subtitle">Access the kitchen display system.</p>

            <div className="auth-promise-badge">
              <span className="material-symbols-rounded">skillet</span>
              Kitchen Staff Only
            </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">mail</span>
                <input
                  type="email"
                  placeholder="kitchen@ktmbites.com"
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
                {loginLoading ? "Signing In..." : "Enter Kitchen"}
              </button>

              <div className="auth-footer" style={{ marginTop: '2rem' }}>
                <Link to="/">Back to Home</Link>
              </div>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <p>Demo Credentials:</p>
              <p>kitchen@ktmbites.com / kitchen123</p>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <AuthCreative />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // DASHBOARD VIEW
  // ═══════════════════════════════════════════
  return (
    <div className="kitchen-dashboard">
      {/* Toast */}
      {toast && (
        <div className={`kitchen-toast toast-${toast.type}`}>
          <span className="material-symbols-rounded">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
          <button
            className="kitchen-toast-close"
            onClick={() => setToast(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="kitchen-header">
        <div className="kitchen-header-left">
          <img
            src={transparentLogo}
            alt="KTM Bites"
            className="kitchen-header-logo"
          />
          <div className="kitchen-header-info">
            <h1 className="kitchen-header-title">Kitchen Display</h1>
            <p className="kitchen-header-subtitle">
              <span className="kitchen-header-live-dot" />
              Live • Auto-refresh every 30s
            </p>
          </div>
        </div>

        <div className="kitchen-header-center">
          <span className="kitchen-header-clock">
            {formatTime(currentTime)}
          </span>
          <button
            className={`kitchen-refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={() => loadOrders(true)}
            disabled={refreshing}
          >
            <span className="material-symbols-rounded">refresh</span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="kitchen-header-right">
          <div className="kitchen-user-tag">
            <span className="material-symbols-rounded">person</span>
            {kitchenUser?.email || "Kitchen Staff"}
          </div>
          <button className="kitchen-logout-btn" onClick={handleLogout}>
            <span className="material-symbols-rounded">logout</span>
            Logout
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="kitchen-stats-bar">
        <div className="kitchen-stat-pill stat-new">
          <span className="material-symbols-rounded">notification_add</span>
          <div className="kitchen-stat-pill-info">
            <span className="kitchen-stat-pill-value">{newOrders.length}</span>
            <span className="kitchen-stat-pill-label">New Orders</span>
          </div>
        </div>
        <div className="kitchen-stat-pill stat-preparing">
          <span className="material-symbols-rounded">skillet</span>
          <div className="kitchen-stat-pill-info">
            <span className="kitchen-stat-pill-value">
              {preparingOrders.length}
            </span>
            <span className="kitchen-stat-pill-label">Preparing</span>
          </div>
        </div>
        <div className="kitchen-stat-pill" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <span className="material-symbols-rounded" style={{ color: '#8b5cf6' }}>inventory</span>
          <div className="kitchen-stat-pill-info">
            <span className="kitchen-stat-pill-value">
              {readyOrders.length}
            </span>
            <span className="kitchen-stat-pill-label">Ready</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <LoadingAnimation message="Loading kitchen dashboard..." />
      ) : (
        <div className="kitchen-board">
          {/* ── Column: New Orders ── */}
          <div className="kitchen-column col-new">
            <div className="kitchen-column-header">
              <div className="kitchen-column-header-left">
                <span className="material-symbols-rounded">
                  notification_add
                </span>
                <h3>New Orders</h3>
              </div>
              <span className="kitchen-column-count">
                {newOrders.length}
              </span>
            </div>
            <div className="kitchen-column-body">
              {newOrders.length === 0 ? (
                <div className="kitchen-column-empty">
                  <span className="material-symbols-rounded">inbox</span>
                  <p>No new orders</p>
                </div>
              ) : (
                newOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    variant="new"
                    actionLabel="Start Preparing"
                    actionIcon="skillet"
                    actionClass="btn-start"
                    onAction={() =>
                      handleStatusChange(order.id, "preparing")
                    }
                    isLoading={actionLoading === order.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Column: Preparing ── */}
          <div className="kitchen-column col-preparing">
            <div className="kitchen-column-header">
              <div className="kitchen-column-header-left">
                <span className="material-symbols-rounded">skillet</span>
                <h3>Preparing</h3>
              </div>
              <span className="kitchen-column-count">
                {preparingOrders.length}
              </span>
            </div>
            <div className="kitchen-column-body">
              {preparingOrders.length === 0 ? (
                <div className="kitchen-column-empty">
                  <span className="material-symbols-rounded">
                    cooking
                  </span>
                  <p>Nothing cooking</p>
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    variant="preparing"
                    actionLabel="Ready for Pickup"
                    actionIcon="inventory"
                    actionClass="btn-ready"
                    onAction={() =>
                      handleStatusChange(order.id, "ready_for_pickup")
                    }
                    isLoading={actionLoading === order.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Column: Ready for Pickup ── */}
          <div className="kitchen-column" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
            <div className="kitchen-column-header" style={{ borderBottomColor: '#8b5cf6' }}>
              <div className="kitchen-column-header-left">
                <span className="material-symbols-rounded" style={{ color: '#8b5cf6' }}>
                  inventory
                </span>
                <h3>Ready for Pickup</h3>
              </div>
              <span className="kitchen-column-count" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                {readyOrders.length}
              </span>
            </div>
            <div className="kitchen-column-body">
              {readyOrders.length === 0 ? (
                <div className="kitchen-column-empty">
                  <span className="material-symbols-rounded">
                    inventory_2
                  </span>
                  <p>No orders ready</p>
                </div>
              ) : (
                readyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    variant="preparing"
                    actionLabel=""
                    actionIcon=""
                    actionClass=""
                    isLoading={false}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// ORDER CARD SUB-COMPONENT
// ═══════════════════════════════════════════

interface OrderCardProps {
  order: KitchenOrder;
  variant: "new" | "preparing" | "done";
  actionLabel?: string;
  actionIcon?: string;
  actionClass?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  variant,
  actionLabel,
  actionIcon,
  actionClass,
  onAction,
  isLoading,
}) => {
  const urgent = variant === "new" && isUrgent(order.created_at);

  return (
    <div className={`kitchen-order-card card-${variant}`}>
      {/* Top row */}
      <div className="kitchen-card-top">
        <span className="kitchen-card-order-id">{order.order_id}</span>
        <span className={`kitchen-card-time ${urgent ? "time-urgent" : ""}`}>
          <span className="material-symbols-rounded">schedule</span>
          {timeAgo(order.created_at)}
        </span>
      </div>

      {/* Customer */}
      <div className="kitchen-card-customer">
        <span className="material-symbols-rounded">person</span>
        {order.full_name}
        {order.phone && (
          <>
            <span className="material-symbols-rounded">call</span>
            {order.phone}
          </>
        )}
      </div>

      {/* Items */}
      <div className="kitchen-card-items">
        {order.items &&
          order.items.map((item) => (
            <div key={item.id} className="kitchen-card-item">
              <div className="kitchen-card-item-info">
                <span className="kitchen-card-item-qty">{item.quantity}×</span>
                <span className="kitchen-card-item-name">{item.name}</span>
              </div>
              <span className="kitchen-card-item-price">
                Rs. {item.subtotal}
              </span>
            </div>
          ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="kitchen-card-notes">
          <span className="material-symbols-rounded">sticky_note_2</span>
          {order.notes}
        </div>
      )}

      {/* Footer with total + action */}
      <div className="kitchen-card-footer">
        <div className="kitchen-card-total">
          <span>Total</span>
          Rs. {order.total}
        </div>
        {onAction && actionLabel && (
          <button
            className={`kitchen-action-btn ${actionClass || ""}`}
            onClick={onAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-rounded">autorenew</span>
                Updating...
              </>
            ) : (
              <>
                <span className="material-symbols-rounded">
                  {actionIcon || "arrow_forward"}
                </span>
                {actionLabel}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Kitchen;
