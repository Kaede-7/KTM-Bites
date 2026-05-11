import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/profile.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { getProfile, updateProfile, logout, type ProfileData } from "../api/auth";
import { getOrders, type OrderData } from "../api/orders";

// ── Toast component ──
const Toast: React.FC<{ msg: string; type: "success" | "error"; onClose: () => void }> = ({ msg, type, onClose }) => (
  <div className={`profile-toast profile-toast-${type}`}>
    <span className="material-symbols-rounded">{type === "success" ? "check_circle" : "error"}</span>
    <span>{msg}</span>
    <button onClick={onClose} className="profile-toast-close">
      <span className="material-symbols-rounded">close</span>
    </button>
  </div>
);

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState<ProfileData>({
    id: 0, fullName: "", email: "", phone: "", address: "", city: "", bio: "",
  } as any);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setFormData(profile);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      getOrders().then(setOrders).catch(console.error);
    }
  }, [activeTab]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); };



  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      delivered: "Delivered", placed: "Placed", preparing: "Preparing",
      ready_for_pickup: "Ready", on_way: "On the Way", cancelled: "Cancelled",
    };
    return map[status] || "Pending";
  };

  const getStatusClass = (status: string) => {
    if (status === "delivered") return "delivered";
    if (status === "cancelled") return "cancelled";
    return "pending";
  };

  const initials = (formData.full_name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const sideLinks = [
    { key: "profile", icon: "person", label: "My Profile" },
    { key: "orders", icon: "receipt_long", label: "Order History" },
  ];

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-container" style={{ padding: "80px 0" }}>
          <LoadingAnimation message="Loading profile..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="profile-container">

        {/* Hero Header */}
        <div className="profile-hero">
          <div className="profile-hero-bg" />
          <div className="profile-hero-content">
            <div className="profile-initials-avatar">{initials}</div>
            <div className="profile-hero-info">
              <h1 className="profile-hero-name">{formData.full_name || "Your Name"}</h1>
              <p className="profile-hero-email">
                <span className="material-symbols-rounded">mail</span>
                {formData.email}
              </p>
              {formData.phone && (
                <p className="profile-hero-phone">
                  <span className="material-symbols-rounded">call</span>
                  {formData.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Layout */}
        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            {sideLinks.map((link) => (
              <button
                key={link.key}
                className={`profile-sidebar-link ${activeTab === link.key ? "active" : ""}`}
                onClick={() => setActiveTab(link.key)}
              >
                <span className="material-symbols-rounded">{link.icon}</span>
                {link.label}
              </button>
            ))}
            <div className="profile-sidebar-divider" />
            <button className="profile-sidebar-link logout" onClick={handleLogout}>
              <span className="material-symbols-rounded">logout</span>
              Logout
            </button>
          </aside>

          <div className="profile-main">
            {/* Mobile Tabs */}
            <div className="profile-tabs-mobile">
              {sideLinks.map((link) => (
                <button
                  key={link.key}
                  className={`profile-tab ${activeTab === link.key ? "active" : ""}`}
                  onClick={() => setActiveTab(link.key)}
                >
                  <span className="material-symbols-rounded">{link.icon}</span>
                  {link.label}
                </button>
              ))}
            </div>

            {/* ── My Profile ── */}
            {activeTab === "profile" && (
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="material-symbols-rounded">edit</span>
                  Edit Profile
                </h3>
                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label>Full Name</label>
                    <div className="profile-input-wrapper">
                      <span className="material-symbols-rounded">person</span>
                      <input type="text" value={formData.full_name || ""} onChange={handleChange("full_name")} placeholder="Your full name" />
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Email</label>
                    <div className="profile-input-wrapper">
                      <span className="material-symbols-rounded">mail</span>
                      <input type="email" value={formData.email || ""} onChange={handleChange("email")} placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Phone</label>
                    <div className="profile-input-wrapper">
                      <span className="material-symbols-rounded">call</span>
                      <input type="tel" value={formData.phone || ""} onChange={handleChange("phone")} placeholder="+977 98XXXXXXXX" />
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>City</label>
                    <div className="profile-input-wrapper">
                      <span className="material-symbols-rounded">location_city</span>
                      <input type="text" value={formData.city || ""} onChange={handleChange("city")} placeholder="Kathmandu" />
                    </div>
                  </div>
                  <div className="profile-field full-width">
                    <label>Delivery Address</label>
                    <div className="profile-input-wrapper">
                      <span className="material-symbols-rounded">location_on</span>
                      <input type="text" value={formData.address || ""} onChange={handleChange("address")} placeholder="e.g. Thamel, Kathmandu near Garden of Dreams" />
                    </div>
                  </div>
                  <div className="profile-field full-width">
                    <label>Bio</label>
                    <textarea value={formData.bio || ""} onChange={handleChange("bio")} placeholder="Food lover based in Kathmandu 🍕" />
                  </div>
                </div>
                <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                  <span className="material-symbols-rounded">{saving ? "autorenew" : "save"}</span>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {/* ── Order History ── */}
            {activeTab === "orders" && (
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="material-symbols-rounded">receipt_long</span>
                  Order History
                </h3>
                <div className="profile-orders-list">
                  {orders.length === 0 ? (
                    <div className="profile-empty">
                      <span className="material-symbols-rounded">receipt_long</span>
                      <p>No orders yet. Go explore the menu!</p>
                      <button className="profile-save-btn" onClick={() => navigate("/menu")}>
                        <span className="material-symbols-rounded">restaurant_menu</span>
                        Browse Menu
                      </button>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="profile-order-card"
                        onClick={() => navigate(`/order-tracking/${order.id}`)}
                      >
                        <div className="profile-order-header">
                          <span className="profile-order-id">{order.order_id}</span>
                          <span className={`profile-order-status ${getStatusClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="profile-order-items">
                          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                        </p>
                        <div className="profile-order-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="profile-order-total">Rs. {order.total}</span>
                            <span 
                              className={`profile-order-status ${order.payment_status === 'completed' ? 'delivered' : order.payment_status === 'failed' ? 'cancelled' : 'pending'}`}
                              style={{ fontSize: '11px', padding: '2px 8px', textTransform: 'capitalize' }}
                            >
                              Khalti: {order.payment_status || 'Pending'}
                            </span>
                            {order.transaction_id && (
                              <span style={{ fontSize: '11px', color: '#666', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                                TXN: {order.transaction_id}
                              </span>
                            )}
                          </div>
                          <span className="profile-order-date">
                            {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
