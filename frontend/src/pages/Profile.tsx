import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/profile.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Skeleton from "../components/Skeleton";
import { getProfile, updateProfile, logout, changePassword, getToken, type ProfileData } from "../api/auth";
import { getOrders, rateRider, type OrderData } from "../api/orders";
import {
  getKharchaLinkStatus,
  getKharchaLinkUrl,
  removeKharchaLink,
  type KharchaLinkStatus,
} from "../api/kharcha";
import PageTransition from "../components/PageTransition";
import LoadingAnimation from "../components/LoadingAnimation";
import { downloadOrderPDF } from "../utils/pdfGenerator";
import { AddressAutocomplete } from "../components/AddressAutocomplete";

// ── Toast Component ──────────────────────────────────────────
const Toast: React.FC<{ msg: string; type: "success" | "error"; onClose: () => void }> = ({ msg, type, onClose }) => (
  <div className={`profile-toast profile-toast-${type}`}>
    <span className="material-symbols-rounded">{type === "success" ? "check_circle" : "error"}</span>
    <span>{msg}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
      <span className="material-symbols-rounded" style={{ fontSize: '18px', color: '#8b7d72' }}>close</span>
    </button>
  </div>
);

// ── Linked Accounts Section (Simplified for this UI) ───────────
interface LinkedAccountsProps {
  showToast: (msg: string, type?: "success" | "error") => void;
}
const LinkedAccountsSection: React.FC<LinkedAccountsProps> = ({ showToast }) => {
  const [status, setStatus] = useState<KharchaLinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    getKharchaLinkStatus()
      .then(setStatus)
      .catch(() => setStatus({ linked: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleLink = () => { window.location.href = getKharchaLinkUrl(); };
  const handleUnlink = async () => {
    if (!window.confirm("Remove your linked Kharcha account?")) return;
    setUnlinking(true);
    try {
      await removeKharchaLink();
      setStatus({ linked: false });
      showToast("Kharcha account unlinked.");
    } catch {
      showToast("Failed to unlink account.", "error");
    } finally {
      setUnlinking(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><LoadingAnimation message="Loading accounts..." /></div>;

  return (
    <div className="profile-section-modern">
      <div className="pm-header">
        <h2>Payment Methods</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Kharcha Card */}
        <div className="wallet-account-card">
          <div className="wallet-info-left">
            <div className="wallet-logo kharcha">K</div>
            <div className="wallet-details">
              <div className="wallet-name">Kharcha Wallet</div>
              <div className={`wallet-status ${status?.linked ? "active" : ""}`}>
                {status?.linked ? "Connected" : "Not Connected"}
              </div>
            </div>
          </div>
          <div className="wallet-action-right">
            {status?.linked ? (
              <button onClick={handleUnlink} disabled={unlinking} className="wallet-btn-secondary">
                {unlinking ? "Removing..." : "Remove"}
              </button>
            ) : (
              <button onClick={handleLink} className="wallet-btn-primary">Link Account</button>
            )}
          </div>
        </div>

        {/* Khalti Card */}
        <div className="wallet-account-card">
          <div className="wallet-info-left">
            <div className="wallet-logo khalti">K</div>
            <div className="wallet-details">
              <div className="wallet-name">Khalti</div>
              <div className="wallet-status active">Available</div>
            </div>
          </div>
          <div className="wallet-action-right">
            <button className="wallet-btn-secondary" disabled>Default Method</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Profile Main Component ─────────────────────────────────────
const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "linked" ? "linked" : "profile");
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    bio: ""
  } as any);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Password States
  const [pwdData, setPwdData] = useState({ old: "", new: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [updatingPwd, setUpdatingPwd] = useState(false);

  // Inline Rider Rating States
  const [activeRatingOrderId, setActiveRatingOrderId] = useState<number | null>(null);
  const [inlineRating, setInlineRating]             = useState<number>(0);
  const [inlineHoverRating, setInlineHoverRating]   = useState<number>(0);
  const [inlineComment, setInlineComment]           = useState<string>("");
  const [submittingInlineId, setSubmittingInlineId] = useState<number | null>(null);
  const [inlineError, setInlineError]               = useState<string>("");

  const handleInlineSubmit = async (orderId: number) => {
    if (inlineRating === 0) {
      setInlineError("Please select a rating of at least 1 star.");
      return;
    }
    setSubmittingInlineId(orderId);
    setInlineError("");
    try {
      const res = await rateRider(orderId, inlineRating, inlineComment);
      setOrders(prevOrders => prevOrders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            has_reviewed_rider: true,
            rider_info: o.rider_info ? {
              ...o.rider_info,
              rating: res.rider_info.rating,
              rating_count: res.rider_info.rating_count
            } : null
          };
        }
        return o;
      }));
      setActiveRatingOrderId(null);
      setInlineRating(0);
      setInlineComment("");
      showToast("Thank you for rating the rider!");
    } catch (err: any) {
      console.error("Inline rating failed:", err);
      setInlineError(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmittingInlineId(null);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setLoading(true);
    getProfile()
      .then((data) => {
        setFormData(data);
      })
      .catch((err) => {
        console.error("Profile load failed:", err);
        // If it's a 401 or we have no data, the session might be dead
        if (err.response?.status === 401 || !getToken()) {
          logout("/login");
        } else {
          showToast("Failed to load profile. Please refresh.", "error");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      getOrders().then(setOrders).catch(console.error);
    }
  }, [activeTab]);

  const handleChange = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      showToast("Profile updated successfully!");
    } catch {
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!pwdData.old || !pwdData.new || !pwdData.confirm) {
      showToast("Please fill in all password fields.", "error");
      return;
    }
    if (pwdData.new !== pwdData.confirm) {
      showToast("New passwords do not match.", "error");
      return;
    }
    setUpdatingPwd(true);
    try {
      await changePassword(pwdData.old, pwdData.new);
      showToast("Password updated successfully!");
      setPwdData({ old: "", new: "", confirm: "" });
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to update password.", "error");
    } finally {
      setUpdatingPwd(false);
    }
  };

  // Rank Modal State
  const [showRanks, setShowRanks] = useState(false);

  // Rank Tiers Data
  const rankTiers = [
    { name: "Rookie", min: 0, discount: 0, color: "#8b7d72", perks: "New to KTM Bites? Place 2 orders to unlock your first discount!" },
    { name: "Bronze", min: 2, discount: 2, color: "#cd7f32", perks: "Basic 2% discount on all orders." },
    { name: "Silver", min: 6, discount: 4, color: "#c0c0c0", perks: "Increased 4% discount + Faster customer support." },
    { name: "Gold", min: 16, discount: 6, color: "#ffd700", perks: "Priority meal preparation + 6% discount." },
    { name: "Platinum", min: 31, discount: 8, color: "#e2f0ff", perks: "Exclusive early access to new menu items + 8% discount." },
    { name: "Diamond", min: 51, discount: 10, color: "#b9f2ff", perks: "Dedicated concierge and maximum 10% discount on all orders." },
    { name: "Mythic Crimson", min: 500, discount: 25, color: "#8b0000", perks: "The ultimate KTM Bites status. Legendary 25% discount, VIP private events, and lifetime free delivery on everything." }
  ];

  const initials = (formData.full_name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navLinks = [
    { key: "profile", icon: "person", label: "Account Information", desc: "Change your account info" },
    ...(formData.has_password ? [{ key: "password", icon: "visibility", label: "Password", desc: "Change your password" }] : []),
    { key: "orders", icon: "receipt_long", label: "Order History", desc: "Track your past orders" },
    { key: "linked", icon: "payments", label: "Payment Methods", desc: "Add your wallet" },
    { key: "invite", icon: "edit", label: "Invite Your Friends", desc: "Get rewards for invitations" },
  ];

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-container">
          <Skeleton type="profile-card" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="profile-page">
      <Navbar />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Rank Tiers Modal */}
      {showRanks && (
        <div className="ranks-modal-overlay" onClick={() => setShowRanks(false)}>
          <div className="ranks-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rm-header">
              <span className="material-symbols-rounded">stars</span>
              <h2>KTM Bites Membership Ranks</h2>
              <button className="rm-close" onClick={() => setShowRanks(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="rm-body">
              <p className="rm-intro">Unlock higher ranks by placing more orders and enjoy premium benefits.</p>
              <div className="ranks-list">
                {rankTiers.map((tier) => (
                  <div 
                    key={tier.name} 
                    className={`profile-rank-card tier-${tier.name.toLowerCase().replace(/\s+/g, '-')} preview-card ${formData.rank?.current_rank === tier.name ? 'current' : ''}`}
                    style={{ '--tier-color': tier.color } as any}
                  >
                    <div className="prc-top">
                      <div className="prc-badge" style={{ backgroundColor: tier.color }}>
                        <span className="material-symbols-rounded">
                          {tier.name === "Mythic Crimson" ? "military_tech" : (tier.name === "Diamond" || tier.name === "Platinum" ? "workspace_premium" : "stars")}
                        </span>
                      </div>
                      <div className="prc-info">
                        <div className="prc-label">Rank Details</div>
                        <div className="prc-name">
                          {tier.name}
                          {formData.rank?.current_rank === tier.name && <span className="rtc-current-label">Current</span>}
                        </div>
                      </div>
                      <div className="prc-discount">
                        <span>{tier.discount}% OFF</span>
                      </div>
                    </div>
                    
                    <div className="prc-preview-details">
                      <div className="rtc-requirement">Unlocks at {tier.min} orders</div>
                      <p className="rtc-perks">{tier.perks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rm-footer">
              <button className="rm-action-btn" onClick={() => setShowRanks(false)}>Got it, thanks!</button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-container">
        <div className="profile-layout">
          
          {/* Sidebar */}
          <aside className="profile-sidebar">
            
            {/* Rank Card */}
            {formData.rank && (
              <div className={`profile-rank-card tier-${formData.rank.current_rank.toLowerCase().replace(/\s+/g, '-')}`} style={{ borderColor: `${formData.rank.color}40` }}>
                <div className="prc-top">
                  <div className="prc-badge" style={{ backgroundColor: formData.rank.color }}>
                    <span className="material-symbols-rounded">
                      {formData.rank.current_rank === "Mythic Crimson" ? "military_tech" : "stars"}
                    </span>
                  </div>
                  <div className="prc-info">
                    <div className="prc-label">Your rank</div>
                    <div className="prc-name">{formData.rank.current_rank}</div>
                  </div>
                  <div className="prc-discount">
                    <span>{formData.rank.discount}% OFF</span>
                  </div>
                </div>
                
                <div className="prc-progress-wrap">
                  <div className="prc-progress-labels">
                    <span>{formData.rank?.order_count} orders</span>
                    <span>{formData.rank?.next_rank}</span>
                  </div>
                  <div className="prc-progress-bar">
                    <div 
                      className="prc-progress-fill" 
                      style={{ 
                        width: `${formData.rank?.progress}%`,
                        backgroundColor: formData.rank?.color 
                      }} 
                    />
                  </div>
                  <div className="prc-footer-row">
                    {formData.rank?.orders_to_next > 0 ? (
                      <div className="prc-hint">
                        {formData.rank?.orders_to_next} more orders to {formData.rank?.next_rank}
                      </div>
                    ) : (
                      <div className="prc-hint">You are at maximum rank!</div>
                    )}
                    <button className="prc-info-btn" onClick={() => setShowRanks(true)}>
                      <span className="material-symbols-rounded">info</span>
                      View Benefits
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <nav className="profile-nav">
              {navLinks.map((link) => (
                <button
                  key={link.key}
                  className={`profile-nav-link ${activeTab === link.key ? "active" : ""}`}
                  onClick={() => setActiveTab(link.key)}
                >
                  <div className="pnl-top">
                    <span className="material-symbols-rounded">{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                  <span className="pnl-desc">{link.desc}</span>
                </button>
              ))}
              
              <button className="profile-nav-link logout" onClick={() => logout()}>
                <div className="pnl-top">
                  <span className="material-symbols-rounded">logout</span>
                  <span>Logout</span>
                </div>
                <span className="pnl-desc">End your session</span>
              </button>
            </nav>

          </aside>

          {/* Main Area */}
          <main className="profile-main">
            
            {activeTab === "profile" && (
              <>
                <div className="pm-header">
                  <div className="pm-header-icon">
                    <span className="material-symbols-rounded">person</span>
                  </div>
                  <div>
                    <h2>Personal Information</h2>
                    <div className="pm-header-sub">Manage your profile details</div>
                  </div>
                </div>

                <div className="profile-avatar-wrap">
                  <div className="profile-avatar-circle">
                    {initials}
                  </div>
                  <div className="pav-info">
                    <h3>{formData.full_name || "Your Name"}</h3>
                    <span className="pav-email">{formData.email}</span>
                    <div className="pav-badge">
                      <span className="material-symbols-rounded" style={{ fontSize: '11px' }}>verified</span>
                      {formData.role || 'User'}
                    </div>
                  </div>
                </div>

                <div className="profile-form-modern">
                  <div className="pf-field">
                    <label className="pf-label">Full Name</label>
                    <div className="pf-input-group">
                      <input 
                        type="text" 
                        value={formData.full_name || ""} 
                        onChange={handleChange("full_name")} 
                        placeholder="Full Name" 
                      />
                    </div>
                  </div>

                  <div className="pf-field">
                    <label className="pf-label">Email Address</label>
                    <div className="pf-input-group">
                      <input 
                        type="email" 
                        value={formData.email || ""} 
                        onChange={handleChange("email")} 
                        placeholder="Email Address" 
                      />
                    </div>
                  </div>

                  <div className="pf-field">
                    <label className="pf-label">Phone Number</label>
                    <div className="pf-input-group">
                      <input 
                        type="tel" 
                        value={formData.phone || ""} 
                        onChange={(e) => {
                          const numericOnly = e.target.value.replace(/\D/g, "");
                          setFormData((prev) => ({ ...prev, phone: numericOnly }));
                        }}
                        placeholder="Phone Number" 
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="pf-row">
                    <div className="pf-field">
                      <label className="pf-label">Street Address</label>
                      <div className="pf-input-group" style={{ overflow: 'visible' }}>
                        <AddressAutocomplete
                          placeholder="Street Address"
                          value={formData.address || ""}
                          onChange={(val) => setFormData((prev) => ({ ...prev, address: val }))}
                        />
                      </div>
                    </div>
                    <div className="pf-field">
                      <label className="pf-label">City</label>
                      <div className="pf-input-group">
                        <select value={formData.city || ""} onChange={handleChange("city")}>
                          <option value="">Select City</option>
                          <option value="Kathmandu">Kathmandu</option>
                          <option value="Lalitpur">Lalitpur</option>
                          <option value="Bhaktapur">Bhaktapur</option>
                        </select>
                        <span className="material-symbols-rounded pf-select-arrow">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <button className="pm-update-btn" onClick={handleSave} disabled={saving}>
                    <span className="material-symbols-rounded">check_circle</span>
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}

            {activeTab === "orders" && (
              <div className="order-history-modern">
                <div className="pm-header">
                  <div className="pm-header-icon">
                    <span className="material-symbols-rounded">receipt_long</span>
                  </div>
                  <div>
                    <h2>Order History</h2>
                    <div className="pm-header-sub">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {orders.length === 0 ? (
                    <div className="oh-empty">
                      <span className="material-symbols-rounded">receipt_long</span>
                      <p>No orders yet. Start exploring the menu!</p>
                    </div>
                  ) : (
                    orders.map(order => (
                      <div key={order.id} className="oh-card" onClick={() => navigate(`/order-tracking/${order.id}`)}>
                        <div className="oh-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="oh-order-id">Order #{order.order_id}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              title="Download PDF Invoice"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadOrderPDF(order as any);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '1px solid #ebdcd0',
                                background: '#fff',
                                color: '#e06c22',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
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
                            </button>
                            <span className={`oh-status oh-status-${order.status}`}>{order.status_display || order.status}</span>
                          </div>
                        </div>
                        <div className="oh-items">
                          {order.items.length === 0 ? "No items" : order.items.map((i: any) => `${i.name} ×${i.quantity}`).join(' · ')}
                        </div>
                        <div 
                          className="oh-card-bottom" 
                          style={{ 
                            borderBottom: order.rider_info ? '1px dashed rgba(242, 139, 70, 0.15)' : 'none', 
                            paddingBottom: order.rider_info ? '12px' : '14px', 
                            marginBottom: order.rider_info ? '12px' : '0' 
                          }}
                        >
                          <span className="oh-total">Rs. {order.total}</span>
                          <span className="oh-date">{new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>

                        {/* Inline Rider rating & details block inside order history card */}
                        {order.rider_info && (
                          <div className="oh-rider-block" onClick={(e) => e.stopPropagation()} style={{ fontSize: '0.9rem', color: '#5a5047', paddingTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '1.2rem', color: '#f28b46' }}>delivery_dining</span>
                                <span style={{ fontWeight: 600 }}>Rider: {order.rider_info.name}</span>
                                <span style={{ color: '#f28b46', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                                  <span className="material-symbols-rounded" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 1" }}>star</span>
                                  {typeof order.rider_info.rating === 'number' ? order.rider_info.rating.toFixed(1) : '0.0'} ({order.rider_info.rating_count || 0})
                                </span>
                              </div>

                              {order.status === 'delivered' && (
                                <>
                                  {order.has_reviewed_rider ? (
                                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                                      <span className="material-symbols-rounded" style={{ fontSize: '1.1rem', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                      Rated
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (activeRatingOrderId === order.id) {
                                          setActiveRatingOrderId(null);
                                        } else {
                                          setActiveRatingOrderId(order.id);
                                          setInlineRating(0);
                                          setInlineComment("");
                                          setInlineError("");
                                        }
                                      }}
                                      style={{
                                        background: activeRatingOrderId === order.id ? '#f5f0eb' : 'linear-gradient(135deg, #f28b46 0%, #e06c22 100%)',
                                        color: activeRatingOrderId === order.id ? '#2a2420' : '#fff',
                                        border: activeRatingOrderId === order.id ? '1px solid rgba(0,0,0,0.1)' : 'none',
                                        borderRadius: '16px',
                                        padding: '4px 12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s ease',
                                        boxShadow: activeRatingOrderId === order.id ? 'none' : '0 2px 8px rgba(242, 139, 70, 0.15)'
                                      }}
                                    >
                                      <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>
                                        {activeRatingOrderId === order.id ? 'close' : 'rate_review'}
                                      </span>
                                      {activeRatingOrderId === order.id ? 'Cancel' : 'Rate Rider'}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Collapsible inline review form */}
                            {activeRatingOrderId === order.id && (
                              <div style={{ marginTop: '12px', background: '#fff', border: '1px solid rgba(242, 139, 70, 0.2)', borderRadius: '12px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: '#2a2420' }}>How was your rider's delivery?</p>
                                
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setInlineRating(star)}
                                      onMouseEnter={() => setInlineHoverRating(star)}
                                      onMouseLeave={() => setInlineHoverRating(0)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, outline: 'none' }}
                                    >
                                      <span className="material-symbols-rounded" style={{
                                        fontSize: '28px',
                                        color: star <= (inlineHoverRating || inlineRating) ? '#f28b46' : '#d2c7bf',
                                        transition: 'all 0.15s ease',
                                        transform: star <= (inlineHoverRating || inlineRating) ? 'scale(1.1)' : 'scale(1)'
                                      }}>
                                        star
                                      </span>
                                    </button>
                                  ))}
                                </div>

                                <textarea
                                  placeholder="Write a comment about your rider... (optional)"
                                  value={inlineComment}
                                  onChange={(e) => setInlineComment(e.target.value)}
                                  style={{
                                    width: '100%',
                                    minHeight: '60px',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    fontFamily: 'inherit',
                                    fontSize: '0.85rem',
                                    marginBottom: '10px',
                                    boxSizing: 'border-box',
                                    resize: 'none',
                                    outline: 'none'
                                  }}
                                />

                                {inlineError && (
                                  <p style={{ color: '#d63031', fontSize: '0.8rem', margin: '0 0 8px 0', fontWeight: 600 }}>{inlineError}</p>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleInlineSubmit(order.id)}
                                  disabled={submittingInlineId === order.id}
                                  style={{
                                    background: 'linear-gradient(135deg, #f28b46 0%, #e06c22 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(242, 139, 70, 0.2)'
                                  }}
                                >
                                  {submittingInlineId === order.id ? 'Submitting...' : 'Submit Feedback'}
                                  <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>send</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "linked" && (
              <LinkedAccountsSection showToast={showToast} />
            )}

            {activeTab === "password" && (
              <div className="password-section-modern">
                <div className="pm-header">
                  <div className="pm-header-icon">
                    <span className="material-symbols-rounded">lock</span>
                  </div>
                  <div>
                    <h2>Change Password</h2>
                    <div className="pm-header-sub">Keep your account secure</div>
                  </div>
                </div>
                <div className="profile-form-modern">
                   <div className="pf-field">
                    <label className="pf-label">Current Password</label>
                    <div className="pf-input-group">
                      <input 
                        type={showPwd.old ? "text" : "password"} 
                        value={pwdData.old}
                        onChange={(e) => setPwdData({...pwdData, old: e.target.value})}
                        placeholder="Current Password" 
                      />
                      <button 
                        className="pf-eye-btn" 
                        onClick={() => setShowPwd({...showPwd, old: !showPwd.old})}
                      >
                        <span className="material-symbols-rounded">
                          {showPwd.old ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="pf-field">
                    <div className="pf-input-group">
                      <input 
                        type={showPwd.new ? "text" : "password"} 
                        value={pwdData.new}
                        onChange={(e) => setPwdData({...pwdData, new: e.target.value})}
                        placeholder="New Password" 
                      />
                      <button 
                        className="pf-eye-btn" 
                        onClick={() => setShowPwd({...showPwd, new: !showPwd.new})}
                      >
                        <span className="material-symbols-rounded">
                          {showPwd.new ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="pf-field">
                    <div className="pf-input-group">
                      <input 
                        type={showPwd.confirm ? "text" : "password"} 
                        value={pwdData.confirm}
                        onChange={(e) => setPwdData({...pwdData, confirm: e.target.value})}
                        placeholder="Confirm New Password" 
                      />
                      <button 
                        className="pf-eye-btn" 
                        onClick={() => setShowPwd({...showPwd, confirm: !showPwd.confirm})}
                      >
                        <span className="material-symbols-rounded">
                          {showPwd.confirm ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <button 
                    className="pm-update-btn" 
                    onClick={handlePasswordUpdate} 
                    disabled={updatingPwd}
                  >
                    {updatingPwd ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "invite" && (
              <div className="invite-section-modern">
                <div className="pm-header">
                  <h2>Invite Your Friends</h2>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px', 
                  background: 'rgba(242, 139, 70, 0.05)', 
                  borderRadius: '24px',
                  border: '1px dashed rgba(242, 139, 70, 0.3)'
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '48px', color: '#f28b46', marginBottom: '16px' }}>group_add</span>
                  <h3>Referral Program Coming Soon!</h3>
                  <p style={{ color: '#8b7d72', maxWidth: '300px', margin: '12px auto' }}>
                    Share the love for KTM Bites and get rewards for every friend who signs up and orders.
                  </p>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Profile;
