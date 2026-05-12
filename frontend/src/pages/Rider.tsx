import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/auth.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { logout as authLogout, getStoredUser, getToken } from "../api/auth";
import { fetchKitchenOrders, updateOrderStatus, type KitchenOrder } from "../api/kitchen";
import { updateRiderLocation } from "../api/orders";
import { fetchRiderProfile } from "../api/rider";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Rider: React.FC = () => {
  const navigate = useNavigate();
  const [riderUser, setRiderUser] = useState<any>(null);

  // Dashboard state
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [hasPhone, setHasPhone] = useState(true);

  // Live GPS state
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Restore session and redirect if needed
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser() as any;
    if (!token || !user || (user.role !== 'RIDER' && !user.is_staff)) {
      authLogout(null);
      navigate("/rider-login");
    } else {
      setRiderUser(user);
    }
  }, [navigate]);

  // Load orders
  const loadOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchKitchenOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (!riderUser) return;
    loadOrders();
    checkProfile();
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, [riderUser]);

  const checkProfile = async () => {
    try {
      const profile = await fetchRiderProfile();
      setHasPhone(!!profile.phone);
    } catch (err) {
      console.error("Profile check failed:", err);
    }
  };




  // Order actions
  const handlePickup = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, "on_way");
      await loadOrders();
    } catch (err: any) {
      console.error("Pickup failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDrop = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, "delivered");
      await loadOrders();
    } catch (err: any) {
      console.error("Drop failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Categorize orders
  const availableOrders = orders.filter((o) => o.status === "ready_for_pickup");
  const pickedOrders = orders.filter((o) => o.status === "on_way" && o.rider === riderUser?.id);
  const droppedOrders = orders.filter((o) => o.status === "delivered" && o.rider === riderUser?.id);

  // ── GPS Location Pinger ────────────────────────────────────
  // Always active when rider is logged in so their position is
  // visible on the dashboard map and sent to the backend.
  useEffect(() => {
    if (!riderUser) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(coords);
        setGpsError(null);
        updateRiderLocation(coords.lat, coords.lng)
          .catch((err) => console.error('Location update failed:', err));
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGpsError(err.code === 1 ? 'Location permission denied' : 'Unable to get location');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [riderUser]);

  // ══════════════════════════════════════════
  // DASHBOARD VIEW
  // ══════════════════════════════════════════
  const user = getStoredUser();
  if (!getToken() || !user) {
    return <LoadingAnimation message="Redirecting to Rider Login..." />;
  }

  return (
    <div className="rider-page">
      <Navbar />

      <div className="rider-container">
        {/* Top Bar */}
        <div className="rider-topbar">
          <div className="rider-topbar-left">
            <h1>Delivery Dashboard</h1>
            <p>Real-time metrics for today, {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.</p>
          </div>
          <div className="rider-topbar-actions">
            <button
              className="rider-refresh-btn"
              style={{ background: "white", color: "#2a2420", border: "1px solid #ddd" }}
              onClick={() => navigate("/rider/profile")}
            >
              <span className="material-symbols-rounded">person</span>
              Profile
            </button>
            <button
              className="rider-refresh-btn"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
            >
              <span className="material-symbols-rounded">refresh</span>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {!hasPhone && (
          <div style={{
            background: "#fff5f5",
            border: "1px solid #feb2b2",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="material-symbols-rounded" style={{ color: "#c53030" }}>warning</span>
              <div>
                <p style={{ fontWeight: "700", color: "#c53030", margin: 0 }}>Missing Phone Number</p>
                <p style={{ fontSize: "13px", color: "#9b2c2c", margin: 0 }}>Customers need your contact info for live tracking. Please update your profile.</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/rider/profile")}
              style={{
                background: "#c53030",
                color: "white",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer"
              }}
            >
              Update Now
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="rider-stats">
          <div className="rider-stat-card">
            <div className="rider-stat-icon orange">
              <span className="material-symbols-rounded">storefront</span>
            </div>
            <div className="rider-stat-label">Available Orders</div>
            <div className="rider-stat-value">{availableOrders.length}</div>
            <span className="rider-stat-badge orange">Ready for pickup</span>
          </div>
          <div className="rider-stat-card">
            <div className="rider-stat-icon blue">
              <span className="material-symbols-rounded">two_wheeler</span>
            </div>
            <div className="rider-stat-label">Picked Up</div>
            <div className="rider-stat-value">{pickedOrders.length}</div>
            <span className="rider-stat-badge blue">In transit</span>
          </div>
          <div className="rider-stat-card">
            <div className="rider-stat-icon green">
              <span className="material-symbols-rounded">check_circle</span>
            </div>
            <div className="rider-stat-label">Delivered</div>
            <div className="rider-stat-value">{droppedOrders.length}</div>
            <span className="rider-stat-badge green">Completed</span>
          </div>
        </div>

        {/* Live GPS Location Card */}
        <div className="rider-section">
          <div className="rider-section-header">
            <h2>Your Live Location</h2>
            <span className="rider-section-count" style={{ background: myLocation ? '#48bb78' : '#f56565', color: 'white' }}>
              {myLocation ? 'LIVE' : 'OFF'}
            </span>
          </div>
          {gpsError ? (
            <div className="rider-empty" style={{ color: '#c53030' }}>
              <span className="material-symbols-rounded">location_off</span>
              {gpsError}. Please enable location services in your browser.
            </div>
          ) : !myLocation ? (
            <div className="rider-empty">
              <span className="material-symbols-rounded">my_location</span>
              Acquiring GPS signal...
            </div>
          ) : (
            <div className="rider-gps-card">
              <div className="rider-gps-map">
                <MapContainer
                  center={[myLocation.lat, myLocation.lng]}
                  zoom={16}
                  scrollWheelZoom={true}
                  zoomControl={true}
                  style={{ width: '100%', height: '100%', borderRadius: '16px' }}
                  key={`${myLocation.lat.toFixed(4)}-${myLocation.lng.toFixed(4)}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[myLocation.lat, myLocation.lng]}
                    icon={L.divIcon({
                      className: 'tracking-marker-rider',
                      html: `<div style="background:#f28b46;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(242,139,70,0.5);"><span class=\"material-symbols-rounded\" style=\"color:white;font-size:22px;\">two_wheeler</span></div>`,
                      iconSize: [40, 40],
                      iconAnchor: [20, 20],
                    })}
                  />
                </MapContainer>
              </div>
              <div className="rider-gps-info">
                <div className="rider-gps-coords">
                  <div className="rider-gps-coord-item">
                    <span className="material-symbols-rounded" style={{ color: '#f28b46', fontSize: '18px' }}>north</span>
                    <span className="rider-gps-label">Latitude</span>
                    <span className="rider-gps-value">{myLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="rider-gps-coord-item">
                    <span className="material-symbols-rounded" style={{ color: '#4a90d9', fontSize: '18px' }}>east</span>
                    <span className="rider-gps-label">Longitude</span>
                    <span className="rider-gps-value">{myLocation.lng.toFixed(6)}</span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#8b7d72', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="rider-gps-pulse" />
                  GPS tracking active — position updated live
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <LoadingAnimation message="Loading deliveries..." />
        ) : (
          <>
            {/* Available for Pickup */}
            <div className="rider-section">
              <div className="rider-section-header">
                <h2>Available for Pickup</h2>
                <span className="rider-section-count">{availableOrders.length}</span>
              </div>
              {availableOrders.length === 0 ? (
                <div className="rider-empty">
                  <span className="material-symbols-rounded">hourglass_empty</span>
                  No orders ready for pickup right now.
                </div>
              ) : (
                <div className="rider-orders-grid">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="rider-order-card">
                      <div className="rider-card-header">
                        <span className="rider-card-id">{order.order_id}</span>
                        <span className="rider-card-amount">Rs. {order.total}</span>
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">person</span>
                        {order.full_name}
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">location_on</span>
                        Deliver to: {order.address}, {order.city}
                      </div>
                      {order.phone && (
                        <div className="rider-card-detail">
                          <span className="material-symbols-rounded">call</span>
                          {order.phone}
                        </div>
                      )}
                      <div className="rider-card-actions">
                        <button
                          className="rider-action-btn rider-btn-pickup"
                          onClick={() => handlePickup(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          <span className="material-symbols-rounded">inventory</span>
                          {actionLoading === order.id ? "Picking…" : "Pick Up"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Picked Up — On the Way */}
            <div className="rider-section">
              <div className="rider-section-header">
                <h2>On the Way</h2>
                <span className="rider-section-count">{pickedOrders.length}</span>
              </div>
              {pickedOrders.length === 0 ? (
                <div className="rider-empty">
                  <span className="material-symbols-rounded">two_wheeler</span>
                  No active deliveries. Pick up an order above!
                </div>
              ) : (
                <div className="rider-orders-grid">
                  {pickedOrders.map((order) => (
                    <div key={order.id} className="rider-order-card">
                      <div className="rider-card-header">
                        <span className="rider-card-id">{order.order_id}</span>
                        <span className="rider-card-amount">Rs. {order.total}</span>
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">person</span>
                        {order.full_name}
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">location_on</span>
                        Deliver to: {order.address}, {order.city}
                      </div>
                      {order.phone && (
                        <div className="rider-card-detail">
                          <span className="material-symbols-rounded">call</span>
                          {order.phone}
                        </div>
                      )}
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">payments</span>
                        {order.payment_method.toUpperCase()}
                      </div>
                      <div className="rider-card-actions">
                        <button
                          className="rider-action-btn rider-btn-drop"
                          onClick={() => handleDrop(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          <span className="material-symbols-rounded">done_all</span>
                          {actionLoading === order.id ? "Delivering…" : "Drop Off"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Deliveries */}
            {droppedOrders.length > 0 && (
              <div className="rider-section">
                <div className="rider-section-header">
                  <h2>Completed Today</h2>
                  <span className="rider-section-count">{droppedOrders.length}</span>
                </div>
                <div className="rider-orders-grid">
                  {droppedOrders.map((order) => (
                    <div key={order.id} className="rider-order-card delivered">
                      <div className="rider-card-header">
                        <span className="rider-card-id">{order.order_id}</span>
                        <span className="rider-delivered-badge">
                          <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>check_circle</span>
                          Delivered
                        </span>
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">location_on</span>
                        {order.address}
                      </div>
                      <div className="rider-card-detail">
                        <span className="material-symbols-rounded">payments</span>
                        Rs. {order.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Rider;
