import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/checkout.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { getCart, type CartData } from "../api/cart";
import { placeOrder, initiatePayment } from "../api/orders";
import { getProfile } from "../api/auth";

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

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [cartData, profileData] = await Promise.all([
          getCart(),
          getProfile()
        ]);
        setCart(cartData);
        if (profileData) {
          setForm(prev => ({
            ...prev,
            fullName: profileData.full_name || prev.fullName,
            phone: profileData.phone || prev.phone,
            address: profileData.address || prev.address,
            city: profileData.city || prev.city,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch checkout data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckoutData();
  }, []);

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
    };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      if (payment === "khalti") {
        const result = await initiatePayment({
          full_name: form.fullName,
          phone: form.phone,
          address: form.address,
          city: form.city,
          landmark: form.landmark,
          notes: form.notes,
          payment_method: payment,
          website_url: window.location.origin,
        });
        window.location.href = result.payment_url;
      } else {
        const order = await placeOrder({
          full_name: form.fullName,
          phone: form.phone,
          address: form.address,
          city: form.city,
          landmark: form.landmark,
          notes: form.notes,
          payment_method: payment,
        });
        navigate(`/order-tracking/${order.id}`);
      }
    } catch (err: any) {
      console.error("Khalti error details:", err.response?.data);
      const errorMessage = err.response?.data?.details 
        ? `Khalti Error: ${JSON.stringify(err.response.data.details)}`
        : err.response?.data?.error || "Failed to place order. Please try again.";
      setError(errorMessage);
    } finally {
      setPlacing(false);
    }
  };

  const subtotal = cart ? Number(cart.total) : 0;
  const deliveryFee = subtotal > 0 ? 80 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="checkout-container">
        <div className="checkout-header">
          <h1 className="checkout-title">
            <span className="material-symbols-rounded">
              shopping_cart_checkout
            </span>
            Checkout
          </h1>
          <p className="checkout-subtitle">Complete your order details below</p>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

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
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    required
                  />
                </div>
                <div className="checkout-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+977-98XXXXXXXX"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    required
                  />
                </div>
                <div className="checkout-field full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    placeholder="Enter your street address"
                    value={form.address}
                    onChange={handleChange("address")}
                    required
                  />
                </div>
                <div className="checkout-field">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={handleChange("city")}
                  />
                </div>
                <div className="checkout-field">
                  <label>Landmark</label>
                  <input
                    type="text"
                    placeholder="Nearby landmark"
                    value={form.landmark}
                    onChange={handleChange("landmark")}
                  />
                </div>
                <div className="checkout-field full-width">
                  <label>Delivery Notes</label>
                  <textarea
                    placeholder="Any special instructions..."
                    value={form.notes}
                    onChange={handleChange("notes")}
                  />
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
                {[
                  {
                    key: "khalti",
                    name: "Khalti",
                    desc: "Pay with Khalti digital wallet",
                    icon: "wallet",
                    color: "#5c2d91",
                  },
                ].map((opt) => (
                  <div
                    key={opt.key}
                    className={`checkout-payment-option ${payment === opt.key ? "selected" : ""}`}
                    onClick={() => setPayment(opt.key)}
                  >
                    <div className="checkout-payment-radio">
                      <div className="checkout-payment-radio-inner" />
                    </div>
                    <div
                      className="checkout-payment-icon"
                      style={{ background: `${opt.color}15` }}
                    >
                      <span
                        className="material-symbols-rounded"
                        style={{ color: opt.color }}
                      >
                        {opt.icon}
                      </span>
                    </div>
                    <div className="checkout-payment-info">
                      <div className="checkout-payment-name">{opt.name}</div>
                      <div className="checkout-payment-desc">{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
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
                    {cart?.items.map((item, i) => (
                      <div key={i} className="checkout-summary-item">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="checkout-summary-item-img"
                        />
                        <div className="checkout-summary-item-info">
                          <span className="checkout-summary-item-name">
                            {item.name}
                          </span>
                          <span className="checkout-summary-item-qty">
                            x{item.quantity}
                          </span>
                        </div>
                        <span className="checkout-summary-item-price">
                          Rs. {item.subtotal}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="checkout-summary-divider" />
                  <div className="checkout-summary-row">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span>Delivery Fee</span>
                    <span>Rs. {deliveryFee}</span>
                  </div>
                  <div className="checkout-summary-divider" />
                  <div className="checkout-summary-total">
                    <span>Total</span>
                    <span>Rs. {total}</span>
                  </div>
                </>
              )}
              <button
                type="submit"
                className="checkout-place-btn"
                disabled={placing}
              >
                <span className="material-symbols-rounded">check_circle</span>
                {placing ? "Placing Order..." : `Place Order — Rs. ${total}`}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
