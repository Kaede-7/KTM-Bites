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
import Skeleton from "../components/Skeleton";
import PageTransition from "../components/PageTransition";
import { AddressAutocomplete } from "../components/AddressAutocomplete";


const Home: React.FC = () => {
  const [favorites, setFavorites] = useState<MenuItemData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
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
      window.dispatchEvent(new Event("cart-updated"));
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
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Check if user has address/phone saved — show modal as needed
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
    <PageTransition>
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
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>


            <div className="address-modal-input-wrap">
              <span className="material-symbols-rounded">location_on</span>
              <AddressAutocomplete
                value={addressInput}
                onChange={setAddressInput}
                placeholder="Delivery Address"
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
            <h1>Welcome {isLoggedIn() ? "back," : "to"} <span>{isLoggedIn() ? (user?.full_name || user?.email?.split("@")[0] || "Guest").split(" ")[0] : "KTM Bites"}</span></h1>
            <p>{isLoggedIn() ? "Your cravings are orbiting. What's on the menu today?" : "Explore the best bites in town. Prepared fresh, delivered fast."}</p>
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
            
            {isLoggedIn() ? (
              <>
                {/* In Progress Card */}
                <div className="home-card home-in-progress">
                  <div className="hip-header">
                    <div className="hip-header-left">
                      <h2>{activeOrder ? "In Progress" : "No Active Orders"}</h2>
                      {!activeOrder && <p>Your recent cravings are satisfied.</p>}
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

                      <div className="hip-horizontal-tracker-new">
                        {[
                          { key: "placed", title: "Received", icon: "receipt_long" },
                          { key: "preparing", title: "Preparing", icon: "restaurant" },
                          { key: "on_way", title: "On the way", icon: "pedal_bike" }
                        ].map((step, i) => {
                          const status = getStepStatus(i);
                          const isLast = i === 2;
                          const nextStatus = !isLast ? getStepStatus(i + 1) : null;
                          return (
                            <React.Fragment key={i}>
                              <div className={`hip-step ${status}`}>
                                <div className="hip-step-icon">
                                  <span className="material-symbols-rounded">{step.icon}</span>
                                </div>
                                <span className="hip-step-label">{step.title}</span>
                              </div>
                              {!isLast && (
                                <div className={`hip-connector ${nextStatus === 'completed' || nextStatus === 'active' ? 'active' : ''}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
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
                    {loading ? (
                      [1, 2, 3].map((k) => (
                        <div className="hro-item" key={k} style={{ opacity: 0.7 }}>
                          <div className="hro-item-left" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="shimmer" style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eeeae6', flexShrink: 0 }} />
                            <div className="hro-item-info" style={{ flex: 1 }}>
                              <Skeleton type="text" style={{ width: '140px', height: '14px', marginBottom: '8px' }} />
                              <Skeleton type="text" style={{ width: '90px', height: '10px' }} />
                            </div>
                          </div>
                          <div className="hro-item-right" style={{ flexShrink: 0, textAlign: 'right' }}>
                            <Skeleton type="text" style={{ width: '60px', height: '14px', marginBottom: '8px', marginLeft: 'auto' }} />
                            <Skeleton type="text" style={{ width: '80px', height: '10px', marginLeft: 'auto' }} />
                          </div>
                        </div>
                      ))
                    ) : recentOrders.length > 0 ? (
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
              </>
            ) : (
              <div className="home-card guest-welcome-card">
                <h2>Ready to Order? <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginLeft: '6px', fontSize: '28px', color: '#f28b46' }}>lunch_dining</span></h2>
                <p>Join thousands of food lovers in Kathmandu. Get exclusive discounts, earn points, and track your food in real-time.</p>
                <div className="guest-actions">
                  <Link to="/signup" className="guest-btn-primary">Create Account</Link>
                  <Link to="/login" className="guest-btn-secondary">Sign In</Link>
                </div>
              </div>
            )}

          </div>

          {/* Right Column */}
          <div className="home-col-right">
            <div className="home-card home-favorites">
              <div className="hf-header">
                <h2>Your Favorites</h2>
              </div>
              <div className="hf-list">
                {loading ? (
                  [1, 2].map((k) => (
                    <div className="hf-item shimmer-container" key={k} style={{ background: '#f5efe9', position: 'relative' }}>
                      <div className="shimmer" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
                      <div className="hf-item-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 60%)' }}>
                        <div className="hf-item-info">
                          <Skeleton type="text" style={{ width: '120px', height: '16px', marginBottom: '8px', background: '#e5ded6' }} />
                          <Skeleton type="text" style={{ width: '160px', height: '12px', background: '#e5ded6' }} />
                        </div>
                        <div className="hf-item-btn shimmer" style={{ background: '#e5ded6', border: 'none' }} />
                      </div>
                    </div>
                  ))
                ) : (
                  favorites.map((item) => (
                    <Link to={`/menu/${item.id}`} className="hf-item" key={item.id}>
                      <FastImage src={item.image} alt={item.name} />
                      <div className="hf-item-overlay">
                        <div className="hf-item-info">
                          <h4>{item.name}</h4>
                          <p>{item.category_name} • Rs. {item.price}</p>
                          <p>
                            <span className="material-symbols-rounded" style={{ fontSize: '15px', marginRight: '4px', verticalAlign: 'middle', color: '#f28b46' }}>local_fire_department</span>
                            {item.calories} kcal
                          </p>
                        </div>
                        <button className="hf-item-btn" onClick={(e) => handleAddToCart(e, item.id)}>
                          <span className="material-symbols-rounded" style={{fontSize: '20px'}}>add</span>
                        </button>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Home;
