import React, { useState, useEffect } from "react";
import PageTransition from "../components/PageTransition";
import { useNavigate } from "react-router-dom";
import "../css/checkout.css";
import "../css/kharcha.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { getCart, type CartData } from "../api/cart";
import { placeOrder, initiatePayment } from "../api/orders";
import { getProfile } from "../api/auth";
import {
  getKharchaLinkStatus,
  initiateKharchaLinkedPayment,
  confirmKharchaPayment,
  initiateKharchaPortalPayment,
  type KharchaLinkStatus,
} from "../api/kharcha";

// ── OTP Modal ──────────────────────────────────────────────────
interface OtpModalProps {
  maskedEmail?: string;
  amount: number;
  onConfirm: (otp: string) => Promise<void>;
  onCancel: () => void;
  confirming: boolean;
  error: string;
}

const OtpModal: React.FC<OtpModalProps> = ({
  maskedEmail,
  amount,
  onConfirm,
  onCancel,
  confirming,
  error,
}) => {
  const [otp, setOtp] = useState("");

  return (
    <div className="kharcha-modal-overlay">
      <div className="kharcha-modal">
        <div className="kharcha-modal-header">
          <div className="kharcha-modal-icon">
            <span className="material-symbols-rounded">lock</span>
          </div>
          <h3>Confirm Payment</h3>
          <p>
            A 6-digit OTP was sent to{" "}
            <strong>{maskedEmail ?? "your Kharcha email"}</strong>
          </p>
        </div>

        <div className="kharcha-modal-amount">
          <span>Amount to pay</span>
          <strong>Rs. {amount}</strong>
        </div>

        <div className="kharcha-otp-field">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="kharcha-otp-input"
            autoFocus
          />
        </div>

        {error && <div className="kharcha-modal-error">{error}</div>}

        <div className="kharcha-modal-actions">
          <button className="kharcha-modal-cancel" onClick={onCancel} disabled={confirming}>
            Cancel
          </button>
          <button
            className="kharcha-modal-confirm"
            onClick={() => onConfirm(otp)}
            disabled={confirming || otp.length !== 6}
          >
            {confirming ? (
              <>
                <span className="material-symbols-rounded kharcha-spin">autorenew</span>
                Verifying…
              </>
            ) : (
              <>
                <span className="material-symbols-rounded">check_circle</span>
                Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [payment, setPayment] = useState("khalti");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "Kathmandu",
    landmark: "",
    notes: "",
  });
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [kharchaStatus, setKharchaStatus] = useState<KharchaLinkStatus>({ linked: false });
  const [userRank, setUserRank] = useState<any>(null);
  const [existingOrder, setExistingOrder] = useState<any>(null);

  // OTP modal state
  const [showOtp, setShowOtp] = useState(false);
  const [otpPaymentId, setOtpPaymentId] = useState("");
  const [otpMaskedEmail, setOtpMaskedEmail] = useState<string | undefined>();
  const [otpAmount, setOtpAmount] = useState(0);
  const [otpConfirming, setOtpConfirming] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [paymentFailed, setPaymentFailed] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const orderIdParam = urlParams.get("orderId");
        const paymentFailedParam = urlParams.get("payment_failed");

        if (paymentFailedParam === "1") setPaymentFailed(true);

        const [profileData, kStatus] = await Promise.all([
          getProfile(),
          getKharchaLinkStatus().catch(() => ({ linked: false })),
        ]);
        setKharchaStatus(kStatus);
        if (profileData) setUserRank(profileData.rank);

        if (orderIdParam) {
          const { getOrder } = await import("../api/orders");
          const orderData = await getOrder(Number(orderIdParam));
          setExistingOrder(orderData);
          setPayment(orderData.payment_method);
          setForm({
            fullName: orderData.full_name,
            phone: orderData.phone,
            address: orderData.address,
            city: orderData.city,
            landmark: orderData.landmark || "",
            notes: orderData.notes || "",
          });
        } else {
          const cartData = await getCart();
          if (cartData.items.length === 0) {
            // Cart is empty. Is there a pending payment order we can resume?
            const { getOrders } = await import("../api/orders");
            const allOrders = await getOrders();
            // Look for latest order that is pending payment
            const pending = allOrders.find(o => o.status === 'pending_payment' || o.payment_status === 'pending');
            if (pending) {
              setExistingOrder(pending);
              setPayment(pending.payment_method);
              setForm({
                fullName: pending.full_name,
                phone: pending.phone,
                address: pending.address,
                city: pending.city,
                landmark: pending.landmark || "",
                notes: pending.notes || "",
              });
              setPaymentFailed(true); // Show the warning banner
            } else {
              setCart(cartData);
            }
          } else {
            setCart(cartData);
          }

          if (profileData) {
            setForm((prev) => ({
              ...prev,
              fullName: profileData.full_name || prev.fullName,
              phone: profileData.phone || prev.phone,
              address: profileData.address || prev.address,
              city: profileData.city || prev.city,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch checkout data:", err);
        setError("Could not load checkout data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
    };

  const orderPayload = {
    full_name: form.fullName,
    phone: form.phone,
    address: form.address,
    city: form.city,
    landmark: form.landmark,
    notes: form.notes,
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPlacing(true);

    try {
      if (existingOrder) {
        const { updateOrder, reinitiatePayment } = await import("../api/orders");
        // Update order first (in case address or payment method changed)
        await updateOrder(existingOrder.id, {
          ...orderPayload,
          payment_method: payment
        });
        
        const res = await reinitiatePayment(existingOrder.id);
        const url = res.payment_url || res.checkout_url;
        if (url) window.location.href = url;
        else navigate(`/order-tracking/${existingOrder.id}`);
        return;
      }

      if (payment === "khalti") {
        const result = await initiatePayment({
          ...orderPayload,
          payment_method: payment,
          website_url: window.location.origin,
        });
        window.location.href = result.payment_url;

      } else if (payment === "kharcha_portal") {
        const result = await initiateKharchaPortalPayment(orderPayload);
        window.location.href = result.checkout_url;

      } else if (payment === "kharcha_linked") {
        const result = await initiateKharchaLinkedPayment(orderPayload);
        setOtpPaymentId(result.payment_id);
        setOtpMaskedEmail(result.masked_email);
        setOtpAmount(result.amount);
        setShowOtp(true);

      } else {
        const order = await placeOrder({ ...orderPayload, payment_method: payment });
        navigate(`/order-tracking/${order.id}`);
      }
    } catch (err: any) {
      let msg = "Failed to place order. Please try again.";
      const d = err.response?.data;
      if (d?.link_url) {
        msg = d.error + " You can link it in your Profile → Linked Accounts.";
      } else if (d?.error) {
        msg = d.error;
      } else if (d?.details) {
        msg = `Error: ${JSON.stringify(d.details)}`;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setPlacing(false);
    }
  };

  const handleOtpConfirm = async (otp: string) => {
    setOtpConfirming(true);
    setOtpError("");
    try {
      const result = await confirmKharchaPayment(otpPaymentId, otp);
      if (result.success) {
        setShowOtp(false);
        navigate(`/order-tracking/${result.order_id}`);
      } else {
        setOtpError(
          result.message +
            (result.attempts_remaining != null
              ? ` (${result.attempts_remaining} attempt${result.attempts_remaining !== 1 ? "s" : ""} left)`
              : "")
        );
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.error ?? "Verification failed. Try again.");
    } finally {
      setOtpConfirming(false);
    }
  };

  const subtotal = existingOrder ? Number(existingOrder.subtotal) : (cart ? Number(cart.total) : 0);
  const isMythic = (existingOrder?.rank_applied === 'Mythic Crimson') || (userRank?.current_rank === 'Mythic Crimson');
  const deliveryFee = existingOrder ? Number(existingOrder.delivery_fee) : (subtotal > 0 ? (isMythic ? 0 : 80) : 0);
  
  // Rank Discount
  let discountAmount = 0;
  let rankName = "";
  if (existingOrder) {
    discountAmount = Number(existingOrder.discount_amount || 0);
    rankName = existingOrder.rank_applied || "";
  } else if (userRank) {
    discountAmount = (subtotal * userRank.discount) / 100;
    rankName = userRank.current_rank;
  }

  const total = existingOrder ? Number(existingOrder.total) : (subtotal + deliveryFee - discountAmount);

  const paymentOptions = [
    {
      key: "khalti",
      name: "Khalti",
      desc: "Pay with Khalti digital wallet",
      icon: "wallet",
      color: "#5c2d91",
      badge: null,
    },
    {
      key: "kharcha_portal",
      name: "Pay with Kharcha",
      desc: "Redirect to Kharcha's secure checkout page",
      icon: "open_in_new",
      color: "#1a7a4a",
      badge: "Hosted",
    },
    ...(kharchaStatus.linked
      ? [
          {
            key: "kharcha_linked",
            name: "Kharcha (Linked Account)",
            desc: "Charge your linked Kharcha wallet — OTP confirm",
            icon: "link",
            color: "#1a7a4a",
            badge: "Quick Pay",
          },
        ]
      : []),
  ];

  return (
    <PageTransition>
      <div className="checkout-page">
      <Navbar />

      {showOtp && (
        <OtpModal
          maskedEmail={otpMaskedEmail}
          amount={otpAmount}
          onConfirm={handleOtpConfirm}
          onCancel={() => { setShowOtp(false); setOtpError(""); }}
          confirming={otpConfirming}
          error={otpError}
        />
      )}

      <div className="checkout-container">
        <div className="checkout-header">
          <h1 className="checkout-title">
            <span className="material-symbols-rounded">shopping_cart_checkout</span>
            {existingOrder ? `Complete Order #${existingOrder.order_id}` : "Checkout"}
          </h1>
          <p className="checkout-subtitle">
            {existingOrder ? "Review your order and complete payment" : "Complete your order details below"}
          </p>
        </div>

        {paymentFailed && (
          <div className="checkout-payment-failed-banner">
            <span className="material-symbols-rounded">warning</span>
            <div>
              <strong>Payment was not completed.</strong>
              <p>Your order is saved. Please retry payment or choose a different method.</p>
            </div>
          </div>
        )}

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="checkout-layout" onSubmit={handlePlaceOrder}>
          <div>
            {/* Delivery Address */}
            <div className="checkout-section">
              <h3 className="checkout-section-title">
                <span className="material-symbols-rounded">location_on</span>
                Delivery Address
              </h3>
              <div className="checkout-form-grid">
                <div className="checkout-field">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your full name" value={form.fullName} onChange={handleChange("fullName")} required />
                </div>
                <div className="checkout-field">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="+977-98XXXXXXXX" value={form.phone} onChange={handleChange("phone")} required />
                </div>
                <div className="checkout-field full-width">
                  <label>Street Address</label>
                  <input type="text" placeholder="Enter your street address" value={form.address} onChange={handleChange("address")} required />
                </div>
                <div className="checkout-field">
                  <label>City</label>
                  <input type="text" placeholder="City" value={form.city} onChange={handleChange("city")} />
                </div>
                <div className="checkout-field">
                  <label>Landmark</label>
                  <input type="text" placeholder="Nearby landmark" value={form.landmark} onChange={handleChange("landmark")} />
                </div>
                <div className="checkout-field full-width">
                  <label>Delivery Notes</label>
                  <textarea placeholder="Any special instructions..." value={form.notes} onChange={handleChange("notes")} />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-section">
              <h3 className="checkout-section-title">
                <span className="material-symbols-rounded">payments</span>
                Payment Method
              </h3>
              <div className="checkout-payment-options">
                {paymentOptions.map((opt) => (
                  <div
                    key={opt.key}
                    className={`checkout-payment-option ${payment === opt.key ? "selected" : ""}`}
                    onClick={() => setPayment(opt.key)}
                  >
                    <div className="checkout-payment-radio">
                      <div className="checkout-payment-radio-inner" />
                    </div>
                    <div className="checkout-payment-icon" style={{ background: `${opt.color}15` }}>
                      <span className="material-symbols-rounded" style={{ color: opt.color }}>
                        {opt.icon}
                      </span>
                    </div>
                    <div className="checkout-payment-info">
                      <div className="checkout-payment-name">
                        {opt.name}
                        {opt.badge && (
                          <span className="kharcha-badge" style={{ background: `${opt.color}18`, color: opt.color }}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className="checkout-payment-desc">{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Kharcha link nudge — shown when neither kharcha option is selected */}
              {!kharchaStatus.linked && (
                <div className="kharcha-link-nudge">
                  <span className="material-symbols-rounded">link</span>
                  <span>
                    Link your Kharcha account in{" "}
                    <a href="/profile" className="kharcha-link-nudge-link">
                      Profile → Linked Accounts
                    </a>{" "}
                    for one-tap OTP checkout next time.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="checkout-summary">
              <h3>Order Summary</h3>
              {loading ? (
                <LoadingAnimation message="Loading cart..." />
              ) : (
                <>
                  <div className="checkout-summary-items">
                    {(existingOrder?.items || cart?.items || []).map((item: any, i: number) => (
                      <div key={i} className="checkout-summary-item">
                        <img src={item.image} alt={item.name} className="checkout-summary-item-img" />
                        <div className="checkout-summary-item-info">
                          <span className="checkout-summary-item-name">{item.name}</span>
                          <span className="checkout-summary-item-qty">x{item.quantity}</span>
                        </div>
                        <span className="checkout-summary-item-price">Rs. {item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                  <div className="checkout-summary-divider" />
                  <div className="checkout-summary-row"><span>Subtotal</span><span>Rs. {subtotal}</span></div>
                  <div className="checkout-summary-row">
                    <span>Delivery Fee {isMythic && <span className="free-badge">(Free)</span>}</span>
                    <span>
                      {isMythic ? (
                        <>
                          <span className="strikethrough-price">Rs. 80</span>
                          <span className="free-price">Rs. 0</span>
                        </>
                      ) : (
                        `Rs. ${deliveryFee}`
                      )}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="checkout-summary-row discount">
                      <span>Rank Discount ({rankName})</span>
                      <span>- Rs. {discountAmount}</span>
                    </div>
                  )}
                  <div className="checkout-summary-divider" />
                  <div className="checkout-summary-total"><span>Total</span><span>Rs. {total}</span></div>
                </>
              )}
              <button type="submit" className="checkout-place-btn" disabled={placing}>
                <span className="material-symbols-rounded">check_circle</span>
                {placing ? "Placing Order…" : `Place Order — Rs. ${total}`}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Checkout;