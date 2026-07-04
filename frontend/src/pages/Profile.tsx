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
import khaltiLogo from "../assets/khalti_logo.svg";
import kharchaLogo from "../assets/kharcha_logo.png";


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
        <div className="pm-header-icon">
          <span className="material-symbols-rounded">payments</span>
        </div>
        <div>
          <h2>Payment Methods</h2>
          <div className="pm-header-sub">Manage your linked digital wallets</div>
        </div>
      </div>
      
      <div className="payment-wallets-list">
        {/* Kharcha Card */}
        <div className="wallet-account-card">
          <div className="wallet-info-left">
            <img src={kharchaLogo} alt="Kharcha Wallet Logo" className="wallet-logo-img kharcha" />
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
            <img src={khaltiLogo} alt="Khalti Wallet Logo" className="wallet-logo-img khalti" />
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
    bio: "",
    calorie_target: null,
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
    let val = e.target.value;
    if (field === "phone") {
      val = val.replace(/\D/g, "");
    }
    setFormData((prev) => ({ ...prev, [field]: val }));
  };


  const handleSave = async () => {
    const calorieTarget = Number(formData.calorie_target);
    if (!Number.isInteger(calorieTarget) || calorieTarget < 500 || calorieTarget > 10000) {
      showToast("Calorie target must be between 500 and 10,000 kcal.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ ...formData, calorie_target: calorieTarget });
      setFormData((prev) => ({ ...prev, calorie_target: calorieTarget }));
      window.dispatchEvent(new Event("cart-updated")); // refresh calorie context
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
              <div>
                <h2>Membership Ranks</h2>
                <p className="rm-header-sub">Place more orders to unlock higher tiers</p>
              </div>
              <button className="rm-close" onClick={() => setShowRanks(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="rm-body">
              <div className="rm-tier-list">
                {rankTiers.map((tier) => {
                  const isCurrent = formData.rank?.current_rank === tier.name;
                  const isUnlocked = (formData.rank?.order_count || 0) >= tier.min;
                  const tierSlug = tier.name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <div 
                      key={tier.name} 
                      className={`rm-tier-card rm-tier-${tierSlug} ${isCurrent ? 'rm-tier-current' : ''} ${!isUnlocked ? 'rm-tier-locked' : ''}`}
                    >
                      <div className="rm-tier-badge">
                        <span className="material-symbols-rounded">
                          {tier.name === "Mythic Crimson" ? "military_tech" : 
                           (tier.name === "Diamond" || tier.name === "Platinum") ? "workspace_premium" : "stars"}
                        </span>
                      </div>
                      <div className="rm-tier-body">
                        <div className="rm-tier-top-row">
                          <div className="rm-tier-name">
                            {tier.name}
                            {isCurrent && <span className="rm-tier-you">You</span>}
                          </div>
                          <div className="rm-tier-right-side">
                            <div className="rm-tier-discount">
                              {tier.discount > 0 ? `${tier.discount}%` : '—'}
                            </div>
                            {!isUnlocked && (
                              <span className="material-symbols-rounded rm-tier-lock-inline">lock</span>
                            )}
                          </div>
                        </div>
                        <div className="rm-tier-req">
                          {tier.min === 0 ? 'Starting tier' : `${tier.min} orders to unlock`}
                        </div>
                        <p className="rm-tier-perks">{tier.perks}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rm-footer">
              <button className="rm-action-btn" onClick={() => setShowRanks(false)}>
                <span className="material-symbols-rounded">check</span>
                Got it
              </button>
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
              <div className={`profile-rank-card tier-${formData.rank.current_rank.toLowerCase().replace(/\s+/g, '-')}`}>
                {/* Card Header */}
                <div className="prc-header">
                  <div className="prc-badge" style={{ backgroundColor: formData.rank.color }}>
                    <span className="material-symbols-rounded">
                      {formData.rank.current_rank === "Mythic Crimson" ? "military_tech" : 
                       (formData.rank.current_rank === "Diamond" || formData.rank.current_rank === "Platinum") ? "workspace_premium" : "stars"}
                    </span>
                  </div>
                  <div className="prc-discount">
                    {formData.rank.discount}% OFF
                  </div>
                </div>

                {/* Rank Title */}
                <div className="prc-title-section">
                  <div className="prc-label">Membership Tier</div>
                  <div className="prc-name">{formData.rank.current_rank}</div>
                </div>

                {/* Stats Row */}
                <div className="prc-stats-row">
                  <div className="prc-stat">
                    <span className="prc-stat-value">{formData.rank?.order_count}</span>
                    <span className="prc-stat-label">Orders</span>
                  </div>
                  <div className="prc-stat-divider" />
                  <div className="prc-stat">
                    <span className="prc-stat-value">{Math.round(formData.rank?.progress || 0)}%</span>
                    <span className="prc-stat-label">Progress</span>
                  </div>
                  <div className="prc-stat-divider" />
                  <div className="prc-stat">
                    <span className="prc-stat-value">{formData.rank.discount}%</span>
                    <span className="prc-stat-label">Discount</span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="prc-progress-section">
                  <div className="prc-progress-meta">
                    <span>{formData.rank?.order_count} / {(formData.rank?.order_count || 0) + (formData.rank?.orders_to_next || 0)} orders</span>
                    <span>{formData.rank?.next_rank || "Max Rank"}</span>
                  </div>
                  <div className="prc-progress-track">
                    <div 
                      className="prc-progress-fill" 
                      style={{ 
                        width: `${formData.rank?.progress}%`,
                        backgroundColor: formData.rank?.color 
                      }} 
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="prc-card-footer">
                  {formData.rank?.orders_to_next > 0 ? (
                    <div className="prc-hint">
                      <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>trending_up</span>
                      {formData.rank?.orders_to_next} more to {formData.rank?.next_rank}
                    </div>
                  ) : (
                    <div className="prc-hint">
                      <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>emoji_events</span>
                      Maximum rank achieved!
                    </div>
                  )}
                  <button className="prc-info-btn" onClick={() => setShowRanks(true)}>
                    All Tiers
                    <span className="material-symbols-rounded">arrow_forward</span>
                  </button>
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
                  <div className="pf-row">
                    <div className="pf-field">
                      <label className="pf-label">Full Name</label>
                      <div className="pf-input-group">
                        <span className="material-symbols-rounded pf-input-icon">person</span>
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
                        <span className="material-symbols-rounded pf-input-icon">mail</span>
                        <input 
                          type="email" 
                          value={formData.email || ""} 
                          onChange={handleChange("email")} 
                          placeholder="Email Address" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pf-row">
                    <div className="pf-field">
                      <label className="pf-label">Phone Number</label>
                      <div className="pf-input-group">
                        <span className="material-symbols-rounded pf-input-icon">call</span>
                        <input 
                          type="tel" 
                          value={formData.phone || ""} 
                          onChange={handleChange("phone")} 
                          placeholder="Phone Number" 
                        />
                      </div>
                    </div>

                    <div className="pf-field">
                      <label className="pf-label">Calorie Target</label>
                      <div className="pf-input-group pf-calorie-input">
                        <span className="material-symbols-rounded pf-input-icon" style={{ color: "#f28b46" }}>local_fire_department</span>
                        <input
                          type="number"
                          min="500"
                          max="10000"
                          step="50"
                          value={formData.calorie_target !== null && formData.calorie_target !== undefined ? formData.calorie_target : ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              calorie_target: e.target.value === "" ? null : Number(e.target.value),
                            }))
                          }
                          placeholder="Daily calorie target"
                        />
                        <span className="pf-calorie-unit">kcal</span>
                      </div>
                      <div className="pf-field-hint">
                        {formData.calorie_target
                          ? "Your cart progress bar will use this target."
                          : "Goal: Not set. Enter a value above and save to configure."}
                      </div>
                    </div>
                  </div>

                  <div className="pf-field">
                    <label className="pf-label">Street Address</label>
                    <div className="pf-input-group" style={{ overflow: "visible" }}>
                      <span className="material-symbols-rounded pf-input-icon">location_on</span>
                      <AddressAutocomplete 
                        value={formData.address || ""} 
                        onChange={(val) => setFormData(prev => ({ ...prev, address: val }))} 
                        placeholder="Street Address" 
                      />
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

            {/* Invite section removed */}
          </main>

        </div>
      </div>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Profile;
