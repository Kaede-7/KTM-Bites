import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/order-tracking.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import FastImage from "../components/FastImage";
import LiveTrackingMap from "../components/LiveTrackingMap";
import { getOrder, getOrders, cancelOrder, rateRider, type OrderData } from "../api/orders";
import { isLoggedIn } from "../api/auth";
import PageTransition from "../components/PageTransition";
import LottieAnimation from "../components/LottieAnimation";
import { motion } from "framer-motion";
import { downloadOrderPDF } from "../utils/pdfGenerator";

const statusSteps = [
  { key: "placed",    title: "Received",  desc: "Order confirmed",          icon: "receipt_long" },
  { key: "preparing", title: "Preparing",     desc: "In the kitchen",           icon: "restaurant" },
  { key: "on_way",   title: "On the way",     desc: "Rider is moving",          icon: "pedal_bike" },
  { key: "delivered",title: "Delivered",      desc: "Enjoy!",                   icon: "done_all" },
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

  const [rating, setRating]             = useState<number>(0);
  const [hoverRating, setHoverRating]   = useState<number>(0);
  const [comment, setComment]           = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);
  const [reviewError, setReviewError]     = useState<string>("");

  const submitRiderReview = async () => {
    if (!order) return;
    if (rating === 0) {
      setReviewError("Please select a rating of at least 1 star.");
      return;
    }
    setSubmittingReview(true);
    setReviewError("");
    try {
      const res = await rateRider(order.id, rating, comment);
      setReviewSuccess(true);
      setOrder(prev => {
        if (!prev) return null;
        return {
          ...prev,
          has_reviewed_rider: true,
          rider_info: prev.rider_info ? {
            ...prev.rider_info,
            rating: res.rider_info.rating,
            rating_count: res.rider_info.rating_count
          } : null
        };
      });
    } catch (err: any) {
      console.error("Failed to submit rider review:", err);
      setReviewError(err.response?.data?.error || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }
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

  // Poll for live updates — fast when rider is on the way, slower otherwise
  useEffect(() => {
    if (!order) return;
    if (order.status === 'delivered' || order.status === 'cancelled') return;

    // Poll every 2s when rider is actively delivering, 10s otherwise
    const interval = order.status === 'on_way' ? 2000 : 10000;

    const pollInterval = setInterval(async () => {
      try {
        if (id === 'latest') {
          const orders = await getOrders();
          if (orders.length > 0) setOrder(orders[0]);
        } else {
          const data = await getOrder(Number(id));
          setOrder(data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, interval);

    return () => clearInterval(pollInterval);
  }, [order?.status, id]);

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

  const currentStepIndex = (() => {
    const idx = statusSteps.findIndex(s => s.key === order.status);
    if (idx !== -1) return idx;
    // Map missing backend statuses to closest frontend step
    if (order.status === "ready_for_pickup") return 1; // Mark as Preparing (done/active)
    return 0;
  })();
  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "active";
    return "pending";
  };
  const getStatusLabel = () => statusSteps.find(s => s.key === order.status)?.title || order.status_display;

  const canCancel = order.status === "placed" && cancelSecs > 0;

  return (
    <PageTransition>
      <div className="tracking-page">
        {order.status === "placed" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="order-success-celebration"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <LottieAnimation type="order-success" width={600} height={600} loop={false} />
          </motion.div>
        )}
        <Navbar />
      <div className="tracking-container">
        <div className="tracking-header-new">
          <div className="header-left-new">
            <h1 className="tracking-title-new">{getStatusLabel()}</h1>
          </div>
          <div className="header-right-new" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => downloadOrderPDF(order)}
              className="download-pdf-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid #ebdcd0',
                background: '#fff',
                color: '#e06c22',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#faf8f5';
                e.currentTarget.style.borderColor = '#f28b46';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#ebdcd0';
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>picture_as_pdf</span>
              Invoice PDF
            </button>
            <span className="order-id-badge-new">#{order.order_id}</span>
          </div>
        </div>

        {/* ── Item Summary Card ─────────────────────────── */}
        <div className="tracking-summary-card">
          <div className="summary-img-wrapper">
            <FastImage src={order.items[0]?.image} alt={order.items[0]?.name} />
          </div>
          <div className="summary-details">
            <h3>{order.items[0]?.name} {order.items.length > 1 ? `+${order.items.length - 1} more` : ''}</h3>
            <p>KTM Bites Kitchen</p>
          </div>
        </div>

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

        {order.status === "pending_payment" && (
          <div className="tracking-pending-payment-banner">
            <div className="tracking-pending-content">
              <span className="material-symbols-rounded">payments</span>
              <div>
                <strong>Payment Required</strong>
                <p>Please complete your payment to confirm this order.</p>
              </div>
            </div>
            <button
              className="tracking-pay-btn"
              onClick={() => navigate(`/checkout?orderId=${order.id}`)}
            >
              Pay Now
              <span className="material-symbols-rounded">arrow_forward</span>
            </button>
          </div>
        )}

        {cancelError && (
          <div className="tracking-error">{cancelError}</div>
        )}

        <div className="tracking-card">
          {/* Timeline */}

          <div className="tracking-timeline-horizontal">
            {statusSteps.map((step, i) => {
              const status = getStepStatus(i);
              const isLast = i === statusSteps.length - 1;
              const nextStatus = !isLast ? getStepStatus(i + 1) : null;
              
              return (
                <React.Fragment key={i}>
                  <div className={`timeline-step-new ${status}`}>
                    <div className="step-icon-wrapper">
                      <span className="material-symbols-rounded">{step.icon}</span>
                    </div>
                    <div className="step-text">
                      <span className="step-label-new">{step.title}</span>
                    </div>
                  </div>
                  {!isLast && (
                    <div className={`timeline-connector ${nextStatus === 'completed' || nextStatus === 'active' ? 'active' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Live GPS Map (only when rider is on the way) ─── */}
        {order.status === 'on_way' && order.rider_location && (
          <div style={{ marginBottom: 32 }}>
            <LiveTrackingMap
              riderLocation={order.rider_location}
              riderInfo={order.rider_info}
              deliveryAddress={order.address}
              deliveryCity={order.city}
            />
          </div>
        )}
        {order.status === 'on_way' && !order.rider_location && (
          <div className="tracking-map-loading" style={{ marginBottom: 32 }}>
            <span className="material-symbols-rounded">my_location</span>
            Waiting for rider's GPS signal...
          </div>
        )}

        {/* ── Rider Delivery & Review Card (only when delivered) ─── */}
        {order.status === 'delivered' && !order.rider_info && (
          <div className="tracking-card" style={{ padding: '24px', background: '#faf8f5', border: '1px dashed #ebdcd0', borderRadius: '16px', marginBottom: '32px', textAlign: 'center', color: '#7a7067' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', color: '#b8a89a', display: 'block', marginBottom: '12px' }}>delivery_dining</span>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#2a2420' }}>No Rider Assigned</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#8b7d72' }}>This order was completed without a registered delivery rider assigned.</p>
          </div>
        )}

        {order.status === 'delivered' && order.rider_info && (
          <div className="tracking-card rider-review-card" style={{ padding: '24px', background: '#faf8f5', border: '1px solid #ebdcd0', borderRadius: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: (order.has_reviewed_rider || reviewSuccess) ? '0' : '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e06c22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>person</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#2a2420' }}>Delivered by {order.rider_info.name}</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#7a7067', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.1rem', color: '#f28b46' }}>star</span>
                    <strong>{typeof order.rider_info.rating === 'number' ? order.rider_info.rating.toFixed(1) : '0.0'}</strong> ({order.rider_info.rating_count || 0} reviews)
                  </p>
                </div>
              </div>
            </div>

            {/* Rating & Comment Form */}
            {!order.has_reviewed_rider && !reviewSuccess && (
              <div style={{ borderTop: '1px solid #ebdcd0', paddingTop: '20px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: '#2a2420' }}>
                  Rate your delivery experience (Optional)
                </p>
                
                {/* 5 Stars Selection */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, outline: 'none' }}
                      aria-label={`Rate ${star} stars`}
                    >
                      <span className="material-symbols-rounded" style={{
                        fontSize: '32px',
                        color: star <= (hoverRating || rating) ? '#f28b46' : '#d2c7bf',
                        transition: 'color 0.2s ease, transform 0.1s ease',
                        transform: star <= (hoverRating || rating) ? 'scale(1.1)' : 'scale(1)'
                      }}>
                        star
                      </span>
                    </button>
                  ))}
                </div>

                {/* Comment Area */}
                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    placeholder="Add a comment about the delivery (e.g. fast delivery, polite rider...)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ebdcd0',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {reviewError && (
                  <p style={{ color: '#d63031', fontSize: '0.85rem', margin: '0 0 12px 0' }}>{reviewError}</p>
                )}

                <button
                  type="button"
                  onClick={submitRiderReview}
                  disabled={submittingReview}
                  style={{
                    background: 'linear-gradient(135deg, #f28b46 0%, #e06c22 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(242, 139, 70, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Feedback'}
                  <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>send</span>
                </button>
              </div>
            )}

            {/* Already Reviewed or Success Message */}
            {(order.has_reviewed_rider || reviewSuccess) && (
              <div style={{
                borderTop: '1px solid #ebdcd0',
                paddingTop: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.9rem',
                fontWeight: 500,
                letterSpacing: '0.01em',
                lineHeight: 1.4
              }}>
                <span className="material-symbols-rounded" style={{
                  fontSize: '1.25rem',
                  color: '#10b981', // Premium emerald green
                  fontVariationSettings: "'FILL' 1",
                  display: 'flex',
                  alignItems: 'center'
                }}>check_circle</span>
                <span style={{ color: '#4b5563' }}>Thank you! You've rated this delivery experience.</span>
              </div>
            )}
          </div>
        )}

        <div className="tracking-details">
          <div className="tracking-detail-card">
            <p className="tracking-detail-label">Delivery Address</p>
            <p className="tracking-detail-value">{order.address}</p>
            {order.landmark && <p className="tracking-detail-sub">{order.landmark}</p>}
          </div>
          <div className="tracking-detail-card">
            <p className="tracking-detail-label">Payment</p>
            <p className="tracking-detail-value">
              Khalti
            </p>
            <p className="tracking-detail-sub">Total — Rs. {order.total}</p>
          </div>
        </div>

        <div className="tracking-items-section">
          <div className="tracking-items-header">
            <h3>Order Items</h3>
            <span className="tracking-item-count">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="tracking-items-list">
            {order.items.map((item, i) => (
              <div key={i} className="tracking-item-row">
                <div className="tracking-item-left">
                  <div className="tracking-item-img-wrapper">
                    <FastImage src={item.image} alt={item.name} className="tracking-item-img" />
                    <span className="tracking-item-qty-badge">{item.quantity}</span>
                  </div>
                  <div className="tracking-item-info">
                    <p className="tracking-item-name">{item.name}</p>
                    <p className="tracking-item-sub">Rs. {item.price} each</p>
                  </div>
                </div>
                <p className="tracking-item-price">Rs. {item.subtotal}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
      </div>
    </PageTransition>
  );
};

export default OrderTracking;
