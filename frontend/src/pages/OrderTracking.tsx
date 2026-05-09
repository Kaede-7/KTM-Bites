import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/order-tracking.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { getOrder, getOrders, cancelOrder, type OrderData } from "../api/orders";

const statusSteps = [
  { key: "placed",    title: "Order Placed",  desc: "Your order has been confirmed",          icon: "check_circle" },
  { key: "preparing", title: "Preparing",     desc: "The restaurant is preparing your food",  icon: "restaurant" },
  { key: "ready_for_pickup", title: "Ready for Pickup", desc: "Your food is ready, waiting for rider", icon: "inventory" },
  { key: "on_way",   title: "On the Way",     desc: "Your rider is heading to you",           icon: "local_shipping" },
  { key: "delivered",title: "Delivered",      desc: "Enjoy your meal!",                       icon: "done_all" },
];

/** Returns seconds remaining in the 5-min cancel window, or 0 if expired */
function getCancelSecondsLeft(createdAt: string): number {
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
  return Math.max(0, 300 - elapsed);
}

const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder]         = useState<OrderData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [cancelSecs, setCancelSecs] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (id === "latest") {
          const orders = await getOrders();
          if (orders.length > 0) setOrder(orders[0]);
        } else {
          const data = await getOrder(Number(id));
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // Countdown timer — updates every second
  useEffect(() => {
    if (!order || order.status !== "placed") return;
    setCancelSecs(getCancelSecondsLeft(order.created_at));
    const interval = setInterval(() => {
      const secs = getCancelSecondsLeft(order.created_at);
      setCancelSecs(secs);
      if (secs <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleCancel = useCallback(async () => {
    if (!order) return;
    setCancelling(true);
    setCancelError("");
    try {
      const result = await cancelOrder(order.id);
      setOrder(result.order);
    } catch (err: any) {
      setCancelError(err.response?.data?.error || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  }, [order]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) return (
    <div className="tracking-page">
      <Navbar />
      <div className="tracking-container"><LoadingAnimation message="Loading order tracking..." /></div>
      <Footer />
    </div>
  );

  if (!order) return (
    <div className="tracking-page">
      <Navbar />
      <div className="tracking-container">
        <div className="menu-empty">
          <span className="material-symbols-rounded">receipt_long</span>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "active";
    return "pending";
  };
  const getStatusLabel = () => statusSteps.find(s => s.key === order.status)?.title || order.status_display;

  const canCancel = order.status === "placed" && cancelSecs > 0;

  return (
    <div className="tracking-page">
      <Navbar />
      <div className="tracking-container">
        <h1 className="tracking-title">Order Tracking</h1>
        <p className="tracking-order-id">Order #{order.order_id}</p>

        {/* ── 5-min Cancel Banner ─────────────────────────── */}
        {order.status === "placed" && (
          <div className={`tracking-cancel-banner ${canCancel ? "" : "expired"}`}>
            {canCancel ? (
              <>
                <span className="material-symbols-rounded">timer</span>
                <span>
                  You can cancel this order within <strong>{formatCountdown(cancelSecs)}</strong>
                </span>
                <button
                  className="tracking-cancel-btn"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling…" : "Cancel Order"}
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-rounded">lock_clock</span>
                <span>Cancellation window has closed.</span>
              </>
            )}
          </div>
        )}

        {order.status === "cancelled" && (
          <div className="tracking-cancelled-notice">
            <span className="material-symbols-rounded">cancel</span>
            This order has been cancelled.
          </div>
        )}

        {cancelError && (
          <div className="tracking-error">{cancelError}</div>
        )}

        <div className="tracking-card">
          <div className="tracking-status-header">
            <span className={`tracking-status-badge ${order.status.replace("_", "-")}`}>
              <span className="material-symbols-rounded">
                {order.status === "delivered" ? "done_all"
                  : order.status === "preparing" ? "restaurant"
                  : order.status === "cancelled" ? "cancel"
                  : order.status === "placed"    ? "check_circle"
                  : "local_shipping"}
              </span>
              {getStatusLabel()}
            </span>
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <span className="tracking-eta">
                <span className="material-symbols-rounded">schedule</span>Est. arrival: 30 min
              </span>
            )}
          </div>

          <div className="tracking-timeline">
            {statusSteps.map((step, i) => (
              <div key={i} className={`tracking-step ${getStepStatus(i)}`}>
                <div className="tracking-step-dot">
                  {getStepStatus(i) === "completed" && <span className="material-symbols-rounded">check</span>}
                  {getStepStatus(i) === "active" && <span className="material-symbols-rounded" style={{ color: "var(--amber)", fontSize: 12 }}>circle</span>}
                </div>
                <h4 className="tracking-step-title">{step.title}</h4>
                <p className="tracking-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tracking-details">
          <div className="tracking-detail-card">
            <p className="tracking-detail-label">Delivery Address</p>
            <p className="tracking-detail-value">{order.address}</p>
            {order.landmark && <p className="tracking-detail-sub">{order.landmark}</p>}
          </div>
          <div className="tracking-detail-card">
            <p className="tracking-detail-label">Payment</p>
            <p className="tracking-detail-value">
              {order.payment_method === "esewa" ? "eSewa"
                : order.payment_method === "khalti" ? "Khalti"
                : "Cash on Delivery"}
            </p>
            <p className="tracking-detail-sub">Total — Rs. {order.total}</p>
          </div>
        </div>

        <div className="tracking-items-card" style={{ marginTop: 24 }}>
          <h3>Order Items</h3>
          {order.items.map((item, i) => (
            <div key={i} className="tracking-item-row">
              <img src={item.image} alt={item.name} className="tracking-item-img" />
              <span className="tracking-item-name">{item.name}</span>
              <span className="tracking-item-qty">x{item.quantity}</span>
              <span className="tracking-item-price">Rs. {item.subtotal}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderTracking;
