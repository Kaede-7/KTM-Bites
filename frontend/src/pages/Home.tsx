import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { getMenuItems, getCategories, type MenuItemData, type CategoryData } from "../api/menu";
import { getStoredUser } from "../api/auth";
import { useFavorites } from "../hooks/useFavorites";

const Home: React.FC = () => {
  const [popularItems, setPopularItems] = useState<MenuItemData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const user = getStoredUser();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, cats] = await Promise.all([
          getMenuItems({ sort: "rating" }),
          getCategories(),
        ]);
        setPopularItems(items.slice(0, 6));
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home-page">
      <Navbar />

      {/* Welcome Banner */}
      <section className="home-banner">
        <div className="home-banner-content">
          <div className="home-banner-text">
            <h1>Welcome back, <span>{user?.full_name || "Guest"}</span> 👋</h1>
            <p>What would you like to eat today?</p>
          </div>
          <div className="home-banner-search">
            <span className="material-symbols-rounded" onClick={handleSearch} style={{ cursor: "pointer" }}>search</span>
            <input 
              type="text" 
              placeholder="Search for food, restaurants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="home-categories">
        <div className="home-section-container">
          <h2 className="home-section-heading">Categories</h2>
          <div className="home-categories-grid">
            {categories.map((cat) => (
              <Link to={`/menu?category=${cat.name}`} key={cat.name} className="home-category-card">
                <div className="home-category-icon">
                  <span className="material-symbols-rounded">{cat.icon}</span>
                </div>
                <span className="home-category-label">{cat.name}</span>
                <span className="home-category-count">{cat.count} items</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Items */}
      <section className="home-popular">
        <div className="home-section-container">
          <div className="home-section-header">
            <h2 className="home-section-heading">Popular Right Now</h2>
            <Link to="/menu" className="home-view-all">
              View All
              <span className="material-symbols-rounded">arrow_forward</span>
            </Link>
          </div>
          {loading ? (
            <LoadingAnimation message="Loading popular items..." />
          ) : (
            <div className="home-popular-grid">
              {popularItems.map((item) => (
                <Link to={`/menu/${item.id}`} key={item.id} className="home-food-card">
                  <div className="home-food-card-img-wrapper">
                    <img src={item.image} alt={item.name} className="home-food-card-img" />
                    {item.badge && <span className="home-food-card-badge">{item.badge}</span>}
                    <button 
                      className={`home-food-card-fav ${isFavorite(item.id) ? "active" : ""}`} 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(item.id);
                      }}
                    >
                      <span className="material-symbols-rounded">favorite</span>
                    </button>
                  </div>
                  <div className="home-food-card-body">
                    <span className="home-food-card-category">{item.category}</span>
                    <h3 className="home-food-card-name">{item.name}</h3>
                    <div className="home-food-card-footer">
                      <span className="home-food-card-price">Rs. {item.price}</span>
                      <span className="home-food-card-rating">
                        <span className="material-symbols-rounded">star</span>
                        {item.rating}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="home-quick-actions">
        <div className="home-section-container">
          <div className="home-actions-grid">
            <Link to="/menu" className="home-action-card">
              <div className="home-action-icon menu-icon">
                <span className="material-symbols-rounded">restaurant_menu</span>
              </div>
              <h3>Browse Menu</h3>
              <p>Explore our full collection</p>
            </Link>
            <Link to="/cart" className="home-action-card">
              <div className="home-action-icon cart-icon">
                <span className="material-symbols-rounded">shopping_cart</span>
              </div>
              <h3>My Cart</h3>
              <p>Review your selections</p>
            </Link>
            <Link to="/order-tracking/latest" className="home-action-card">
              <div className="home-action-icon track-icon">
                <span className="material-symbols-rounded">local_shipping</span>
              </div>
              <h3>Track Order</h3>
              <p>Follow your delivery</p>
            </Link>
            <Link to="/profile" className="home-action-card">
              <div className="home-action-icon profile-icon">
                <span className="material-symbols-rounded">person</span>
              </div>
              <h3>My Profile</h3>
              <p>Manage your account</p>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
