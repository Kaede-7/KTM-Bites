import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getMenuItems, type MenuItemData } from "../api/menu";
import { getOrders, type OrderData } from "../api/orders";
import { getStoredUser } from "../api/auth";

const Home: React.FC = () => {
  const [favorites, setFavorites] = useState<MenuItemData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const user = getStoredUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, userOrders] = await Promise.all([
          getMenuItems({ sort: "rating" }),
          getOrders().catch(() => []) // Catch if orders fail or empty
        ]);
        setFavorites(items.slice(0, 3));
        setOrders(userOrders);
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      }
    };
    fetchData();
  }, []);

  const activeOrder = orders.find(o => !["DELIVERED", "CANCELLED"].includes(o.status));
  const recentOrders = orders.filter(o => o.status === "DELIVERED").slice(0, 3);

  // Status mapping to calculate progress bar percentages
  const statusMap = {
    "PENDING": 0,
    "PREPARING": 1,
    "OUT_FOR_DELIVERY": 2,
    "DELIVERED": 3
  };
  
  const getProgressWidth = (status: string) => {
    const s = statusMap[status as keyof typeof statusMap] || 0;
    if (s === 0) return "0%";
    if (s === 1) return "50%";
    if (s >= 2) return "100%";
    return "0%";
  };

  return (
    <div className="home-page">
      <Navbar />

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
            {/* Food image matching the dark elegant aesthetic */}
            <img 
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop&crop=center" 
              alt="Delicious food" 
            />
          </div>
        </section>

        {/* Main Layout */}
        <div className="home-layout">
          {/* Left Column */}
          <div className="home-col-left">
            
            {/* In Progress Card */}
            <div className="home-card home-in-progress">
              <div className="hip-header">
                <div>
                  <h2>{activeOrder ? "In Progress" : "No Active Orders"}</h2>
                  <p>{activeOrder ? `Arriving in ~25 mins` : "Your recent cravings are satisfied."}</p>
                </div>
                {activeOrder && (
                  <span className="hip-badge">#{activeOrder.order_id}</span>
                )}
              </div>

              {activeOrder && (
                <>
                  <div className="hip-item">
                    <img src={activeOrder.items[0]?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop"} alt="Item" />
                    <div className="hip-item-info">
                      <h3>{activeOrder.items[0]?.name || "Custom Order"} {activeOrder.items.length > 1 ? `+${activeOrder.items.length - 1} more` : ""}</h3>
                      <p>KTM Bites Kitchen</p>
                    </div>
                  </div>

                  <div className="hip-progress">
                    <div className="hip-progress-bar" style={{ width: getProgressWidth(activeOrder.status) }}></div>
                    <div className={`hip-step ${statusMap[activeOrder.status as keyof typeof statusMap] >= 0 ? "active" : ""}`}>
                      <div className="hip-step-icon"><span className="material-symbols-rounded">receipt_long</span></div>
                      <span className="hip-step-label">Received</span>
                    </div>
                    <div className={`hip-step ${statusMap[activeOrder.status as keyof typeof statusMap] >= 1 ? "active" : ""}`}>
                      <div className="hip-step-icon"><span className="material-symbols-rounded">skillet</span></div>
                      <span className="hip-step-label">Preparing</span>
                    </div>
                    <div className={`hip-step ${statusMap[activeOrder.status as keyof typeof statusMap] >= 2 ? "active" : ""}`}>
                      <div className="hip-step-icon"><span className="material-symbols-rounded">two_wheeler</span></div>
                      <span className="hip-step-label">On the way</span>
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
                    <img src={item.image} alt={item.name} />
                    <div className="hf-item-overlay">
                      <div className="hf-item-info">
                        <h4>{item.name}</h4>
                        <p>{item.category}</p>
                      </div>
                      <button className="hf-item-btn" onClick={(e) => { e.preventDefault(); }}>
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
