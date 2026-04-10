import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/profile.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getProfile, updateProfile, changePassword, logout, type ProfileData } from "../api/auth";
import { getOrders, type OrderData } from "../api/orders";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState<ProfileData>({
    id: 0,
    fullName: "",
    email: "",
    phone: "",
    address: "Thamel, Kathmandu",
    city: "Kathmandu",
    bio: "Food lover based in Kathmandu 🍕",
  } as any);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handlePasswordChange = async () => {
    setPasswordMsg('');
    setPasswordError('');
    if (!passwordData.current || !passwordData.newPass) {
      setPasswordError('Please fill in all fields');
      return;
    }
    if (passwordData.newPass !== passwordData.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordData.newPass.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      const result = await changePassword(passwordData.current, passwordData.newPass);
      setPasswordMsg(result.message);
      setPasswordData({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const sideLinks = [
    { key: "profile", icon: "person", label: "My Profile" },
    { key: "orders", icon: "receipt_long", label: "Order History" },
    { key: "addresses", icon: "location_on", label: "Saved Addresses" },
    { key: "settings", icon: "settings", label: "Account Settings" },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'placed': return 'Placed';
      case 'preparing': return 'Preparing';
      case 'on_way': return 'On the Way';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  };

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <span className="material-symbols-rounded">person</span>
            </div>
            <button className="profile-avatar-edit">
              <span className="material-symbols-rounded">photo_camera</span>
            </button>
          </div>
          <div className="profile-header-info">
            <h2 className="profile-name">{formData.full_name || "Loading..."}</h2>
            <p className="profile-email">{formData.email}</p>
          </div>
        </div>

        {/* Tab Layout */}
        <div className="profile-layout">
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
              {sideLinks.slice(0, 3).map((link) => (
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

            {activeTab === "profile" && (
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="material-symbols-rounded">edit</span>Edit Profile
                </h3>
                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label>Full Name</label>
                    <input type="text" value={formData.full_name || ""} onChange={handleChange("full_name")} />
                  </div>
                  <div className="profile-field">
                    <label>Email</label>
                    <input type="email" value={formData.email || ""} onChange={handleChange("email")} />
                  </div>
                  <div className="profile-field">
                    <label>Phone</label>
                    <input type="tel" value={formData.phone || ""} onChange={handleChange("phone")} />
                  </div>
                  <div className="profile-field">
                    <label>City</label>
                    <input type="text" value={formData.city || ""} onChange={handleChange("city")} />
                  </div>
                  <div className="profile-field full-width">
                    <label>Address</label>
                    <input type="text" value={formData.address || ""} onChange={handleChange("address")} />
                  </div>
                  <div className="profile-field full-width">
                    <label>Bio</label>
                    <textarea value={formData.bio || ""} onChange={handleChange("bio")} />
                  </div>
                </div>
                <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                  <span className="material-symbols-rounded">save</span>{saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="material-symbols-rounded">receipt_long</span>Order History
                </h3>
                <div className="profile-orders-list">
                  {orders.length === 0 ? (
                    <p style={{ color: "var(--muted)", padding: "20px 0" }}>No orders yet</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="profile-order-card" onClick={() => navigate(`/order-tracking/${order.id}`)} style={{ cursor: "pointer" }}>
                        <div className="profile-order-header">
                          <span className="profile-order-id">#{order.order_id}</span>
                          <span className={`profile-order-status ${order.status === "delivered" ? "delivered" : "pending"}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="profile-order-items">{order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}</p>
                        <div className="profile-order-footer">
                          <span className="profile-order-total">Rs. {order.total}</span>
                          <span className="profile-order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="material-symbols-rounded">location_on</span>Saved Addresses
                </h3>
                <div className="profile-addresses-list">
                  <div className="profile-address-card active-address">
                    <div className="profile-address-header">
                      <span className="profile-address-label">
                        <span className="material-symbols-rounded">home</span>Home
                      </span>
                      <span className="profile-address-default">Default</span>
                    </div>
                    <p className="profile-address-text">{formData.address || "Thamel, Kathmandu"}</p>
                    <p className="profile-address-sub">Near Garden of Dreams</p>
                  </div>
                  <button className="profile-add-address-btn">
                    <span className="material-symbols-rounded">add</span>Add New Address
                  </button>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="material-symbols-rounded">settings</span>Account Settings
                </h3>
                {passwordMsg && <div style={{ color: '#4caf50', marginBottom: 12, padding: '10px 14px', background: '#4caf5015', borderRadius: 8, fontSize: '0.9rem' }}>{passwordMsg}</div>}
                {passwordError && <div style={{ color: '#f44336', marginBottom: 12, padding: '10px 14px', background: '#f4433615', borderRadius: 8, fontSize: '0.9rem' }}>{passwordError}</div>}
                <div className="profile-form-grid">
                  <div className="profile-field full-width">
                    <label>Current Password</label>
                    <input type="password" placeholder="Enter current password" value={passwordData.current} onChange={(e) => setPasswordData(p => ({ ...p, current: e.target.value }))} />
                  </div>
                  <div className="profile-field">
                    <label>New Password</label>
                    <input type="password" placeholder="Enter new password" value={passwordData.newPass} onChange={(e) => setPasswordData(p => ({ ...p, newPass: e.target.value }))} />
                  </div>
                  <div className="profile-field">
                    <label>Confirm New Password</label>
                    <input type="password" placeholder="Confirm new password" value={passwordData.confirm} onChange={(e) => setPasswordData(p => ({ ...p, confirm: e.target.value }))} />
                  </div>
                </div>
                <button className="profile-save-btn" onClick={handlePasswordChange} disabled={changingPassword}>
                  <span className="material-symbols-rounded">lock_reset</span>{changingPassword ? "Updating..." : "Update Password"}
                </button>
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
