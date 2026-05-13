import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FastImage from "../components/FastImage";
import { getMenuItems, type MenuItemData } from "../api/menu";
import { getOrders, type OrderData } from "../api/orders";
import { getStoredUser, isLoggedIn, getProfile, updateProfile } from "../api/auth";
import { addToCart } from "../api/cart";
import AIRecommendations from "../components/AIRecommendations";
import { useToast } from "../components/Toast";

const Home: React.FC = () => {
  const [favorites, setFavorites] = useState<MenuItemData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const user = getStoredUser();
  const { showToast } = useToast();

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent, itemId: number) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      window.location.href = "/login";
      return;
    }
    try {
      await addToCart(itemId, 1);
      showToast("Added to cart!", "success");
    } catch (err) {
      console.error("Failed to add to cart:", err);
      showToast("Failed to add to cart. Please try again.", "error");
    }
  };

  useEffect(() => {
    // Stale-while-revalidate: Load from localStorage first for instant UI
    const cached = localStorage.getItem("ktm_home_data");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setFavorites(parsed.favorites || []);
        setOrders(parsed.orders || []);
      } catch (e) { /* silent */ }
    }

    const fetchData = async () => {
      try {
        const [items, userOrders] = await Promise.all([
          getMenuItems({ sort: "rating" }),
          isLoggedIn() ? getOrders().catch(() => []) : Promise.resolve([])
        ]);
        const favs = items.slice(0, 3);
        setFavorites(favs);
        setOrders(userOrders);
        
        // Cache the fresh data
        localStorage.setItem("ktm_home_data", JSON.stringify({ favorites: favs, orders: userOrders }));
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      }
    };
    fetchData();

    // Check if user has address and phone saved in DB — if yes, never show again
    if (isLoggedIn()) {
      getProfile().then((profile) => {
        const hasAddress = profile.address && profile.address.trim() !== "" && profile.address !== "Thamel, Kathmandu";
        const hasPhone = profile.phone && profile.phone.trim() !== "";
        if (!hasAddress || !hasPhone) {
          setShowAddressModal(true);
        }
      }).catch(() => {});
    }
  }, []);

  const handleSaveAddress = async () => {
    if (!addressInput.trim() || !phoneInput.trim()) return;
    setSavingAddress(true);
    try {
      await updateProfile({ address: addressInput.trim(), phone: phoneInput.trim() });
      showToast("Delivery details saved!", "success");
      setShowAddressModal(false);
    } catch {
      showToast("Failed to save details.", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const activeOrder = orders.find(o => !["delivered", "cancelled"].includes(o.status?.toLowerCase()));
  const recentOrders = orders.filter(o => o.status?.toLowerCase() === "delivered").slice(0, 3);

  const currentStepIndex = !activeOrder ? -1
    : activeOrder.status === "placed" ? 0 
    : (activeOrder.status === "preparing" || activeOrder.status === "ready_for_pickup") ? 1
    : (activeOrder.status === "on_way" || activeOrder.status === "delivered") ? 2
    : -1;

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "active";
    return "pending";
  };

  return (
    <div className="home-page">
      <Navbar />

      {/* Address Modal */}
      {showAddressModal && (
        <div className="address-modal-overlay">
          <div className="address-modal">
            <div className="address-modal-icon">
              <span className="material-symbols-rounded">location_on</span>
            </div>
            <h2>Where should we deliver?</h2>
            <p>Add your delivery address and phone number to get started with your first order.</p>
            
            <div className="address-modal-input-wrap">
              <span className="material-symbols-rounded">call</span>
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="address-modal-input-wrap">
              <span className="material-symbols-rounded">location_on</span>
              <input
                type="text"
                placeholder="Delivery Address (e.g. Thamel, Kathmandu)"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveAddress()}
              />
            </div>
            <div className="address-modal-actions">
              <button className="address-modal-skip" onClick={() => setShowAddressModal(false)}>
                Skip for now
              </button>
              <button className="address-modal-save" onClick={handleSaveAddress} disabled={savingAddress || !addressInput.trim() || !phoneInput.trim()}>
                <span className="material-symbols-rounded">{savingAddress ? "autorenew" : "check"}</span>
                {savingAddress ? "Saving..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="home-container">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="home-hero-text">
            <h1>Welcome back, <span>{user?.full_name?.split(" ")[0] || "Guest"}</span>.</h1>
            <p>Your cravings are orbiting. What's on the menu today?</p>
            <Link to="/menu" className="home-hero-btn">
              Explore Menu <span className="material-symbols-rounded" style={{fontSize: '18px'}}>arrow_forward</span>
            </Link>
          </div>
          <div className="home-hero-img-container">
            <FastImage 
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop&crop=center" 
              alt="Delicious food" 
            />
          </div>
        </section>

        {/* AI Recommendations */}
        <AIRecommendations />

        {/* Main Layout */}
        <div className="home-layout">
          {/* Left Column */}
          <div className="home-col-left">
            
            {/* In Progress Card */}
            <div className="home-card home-in-progress">
              <div className="hip-header">
                <div className="hip-header-left">
                  <h2>{activeOrder ? "In Progress" : "No Active Orders"}</h2>
                  <p>{activeOrder ? `Arriving in ~25 mins` : "Your recent cravings are satisfied."}</p>
                </div>
                {activeOrder && (
                  <span className="hip-badge">#{activeOrder.order_id}</span>
                )}
              </div>

              {activeOrder && (
                <>
                  <div className="hip-item-preview">
                    <div className="hip-img-container">
                      <FastImage src={activeOrder.items[0]?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop"} alt="Item" />
                    </div>
                    <div className="hip-item-info">
                      <h3>{activeOrder.items[0]?.name || "Custom Order"} {activeOrder.items.length > 1 ? `+${activeOrder.items.length - 1} more` : ""}</h3>
                      <p>KTM Bites Kitchen</p>
                    </div>
                  </div>

                  <div className="hip-horizontal-tracker">
                    <div className="tracker-line">
                      <div className="tracker-line-fill" style={{ width: `${(currentStepIndex / 2) * 100}%` }}></div>
                    </div>
                    <div className="tracker-steps">
                      <div className={`tracker-step-item ${getStepStatus(0)}`}>
                        <div className="step-icon-circle">
                          <span className="material-symbols-rounded">receipt_long</span>
                        </div>
                        <span>Received</span>
                      </div>
                      <div className={`tracker-step-item ${getStepStatus(1)}`}>
                        <div className="step-icon-circle">
                          <span className="material-symbols-rounded">restaurant</span>
                        </div>
                        <span>Preparing</span>
                      </div>
                      <div className={`tracker-step-item ${getStepStatus(2)}`}>
                        <div className="step-icon-circle">
                          <span className="material-symbols-rounded">directions_bike</span>
                        </div>
                        <span>On the way</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Recent Orders */}
            <div className="home-card home-recent-orders">
              <div className="hro-header">
                <h2>Recent Orders</h2>
                <Link to="/profile">View All</Link>
              </div>
              
              <div className="hro-list">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div className="hro-item" key={order.id}>
                      <div className="hro-item-left">
                        <div className="hro-item-icon">
                          <span className="material-symbols-rounded">receipt</span>
                        </div>
                        <div className="hro-item-info">
                          <h4>{order.items[0]?.name || "Order"} {order.items.length > 1 ? `+${order.items.length - 1}` : ""}</h4>
                          <p>KTM Bites • {new Date(order.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="hro-item-right">
                        <div className="hro-item-price">Rs. {order.total}</div>
                        <div className="hro-item-status">@ {order.status_display}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{color: "#8b7d72", fontSize: "14px"}}>You haven't placed any orders yet. Time to explore!</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="home-col-right">
            <div className="home-card home-favorites">
              <div className="hf-header">
                <h2>Your Favorites</h2>
              </div>
              <div className="hf-list">
                {favorites.map((item) => (
                  <Link to={`/menu/${item.id}`} className="hf-item" key={item.id}>
                    <FastImage src={item.image} alt={item.name} />
                    <div className="hf-item-overlay">
                      <div className="hf-item-info">
                        <h4>{item.name}</h4>
                        <p>{item.category_name} • Rs. {item.price}</p>
                      </div>
                      <button className="hf-item-btn" onClick={(e) => handleAddToCart(e, item.id)}>
                        <span className="material-symbols-rounded" style={{fontSize: '20px'}}>add</span>
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Home;
