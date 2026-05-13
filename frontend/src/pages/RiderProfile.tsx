import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/auth.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import "../css/order-tracking.css";
import { logout, getToken } from "../api/auth";
import { fetchRiderProfile, updateRiderProfile, type RiderProfileData } from "../api/rider";
import { useToast } from "../components/Toast";

const RiderProfile: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<RiderProfileData>({
    full_name: "",
    email: "",
    phone: "",
    vehicle_type: "",
    license_number: "",
    is_available: true,
  });

  useEffect(() => {
    const token = getToken();
    if (!token || !token.startsWith('RIDER_TOKEN_')) {
      console.warn("Unauthorized access to rider profile - redirecting");
      navigate("/rider-login");
      return;
    }

    const getProfile = async () => {
      try {
        const data = await fetchRiderProfile();
        setProfile(data);
      } catch (err) {
        showToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.phone) {
      showToast("Phone number is required for deliveries", "error");
      return;
    }

    setSaving(true);
    try {
      await updateRiderProfile(profile);
      showToast("Profile updated successfully", "success");
      setTimeout(() => navigate("/rider"), 1500);
    } catch (err) {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingAnimation />;

  return (
    <div className="tracking-page" style={{ background: "#fdf6f0", minHeight: "100vh" }}>
      <Navbar />
      <div className="tracking-container" style={{ maxWidth: "600px", marginTop: "40px" }}>
        <div className="tracking-card auth-fade-in" style={{ padding: "40px" }}>
          <div className="auth-badge-rider" style={{ marginBottom: "20px" }}>RIDER PROFILE</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
            <h1 className="tracking-title" style={{ fontSize: "28px", margin: 0 }}>Delivery Partner Settings</h1>
            <button 
              className="navbar-logout-btn" 
              style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "8px", borderRadius: "10px" }}
              onClick={() => logout("/rider-login")}
              title="Logout"
            >
              <span className="material-symbols-rounded">logout</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-wrapper">
              <span className="material-symbols-rounded">person</span>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={profile.full_name} 
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} 
                required 
              />
            </div>

            <div className="auth-input-wrapper">
              <span className="material-symbols-rounded">mail</span>
              <input 
                type="email" 
                placeholder="Email (Read Only)" 
                value={profile.email} 
                disabled 
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>

            <div className="auth-input-wrapper">
              <span className="material-symbols-rounded">call</span>
              <input 
                type="tel" 
                placeholder="Phone Number (Public for Customers)" 
                value={profile.phone} 
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                required 
              />
            </div>

            <div style={{ margin: "24px 0", height: "1px", background: "rgba(0,0,0,0.05)" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "#8b7d72" }}>Vehicle Information</h3>

            <div className="auth-input-wrapper">
              <span className="material-symbols-rounded">directions_bike</span>
              <input 
                type="text" 
                placeholder="Vehicle Type (e.g. Honda Dio)" 
                value={profile.vehicle_type} 
                onChange={(e) => setProfile({ ...profile, vehicle_type: e.target.value })} 
              />
            </div>

            <div className="auth-input-wrapper">
              <span className="material-symbols-rounded">badge</span>
              <input 
                type="text" 
                placeholder="License Number" 
                value={profile.license_number} 
                onChange={(e) => setProfile({ ...profile, license_number: e.target.value })} 
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", padding: "16px", background: "#fdf6f0", borderRadius: "16px" }}>
                <input 
                  type="checkbox" 
                  id="availability"
                  checked={profile.is_available}
                  onChange={(e) => setProfile({ ...profile, is_available: e.target.checked })}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <label htmlFor="availability" style={{ fontSize: "14px", fontWeight: "600", color: "#2a2420", cursor: "pointer" }}>
                    Available for new orders
                </label>
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "40px" }}>
                <button 
                  type="button" 
                  className="auth-tab-modern" 
                  style={{ flex: 1, height: "56px", border: "1px solid #ddd", background: "transparent" }}
                  onClick={() => navigate("/rider")}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="auth-submit-btn" 
                  style={{ flex: 2, margin: 0 }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update Profile"}
                </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RiderProfile;
