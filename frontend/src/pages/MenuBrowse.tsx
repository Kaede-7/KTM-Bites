import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/menu.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Skeleton from "../components/Skeleton";
import FastImage from "../components/FastImage";
import { getMenuItems, getCategories, type MenuItemData, type CategoryData } from "../api/menu";
import { addToCart } from "../api/cart";
import { isLoggedIn } from "../api/auth";
import { useToast } from "../components/Toast";
import { motion, type Variants } from "framer-motion";
import PageTransition from "../components/PageTransition";

const MenuBrowse: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeCat, setActiveCat] = useState(searchParams.get("category") || "All");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [trendingItems, setTrendingItems] = useState<MenuItemData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync filter state when the URL query params change
  useEffect(() => {
    const cat = searchParams.get("category") || "All";
    const q = searchParams.get("search") || "";
    setActiveCat(cat);
    setSearch(q);
  }, [searchParams]);

  // Fetch categories and trending items on mount
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getMenuItems({ sort: "rating" }).then(data => {
      setTrendingItems(data.slice(0, 2)); // Top 2 for trending
    }).catch(console.error);
  }, []);

  // Fetch items when filters change
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const data = await getMenuItems({
          category: activeCat !== "All" ? activeCat : undefined,
          search: search || undefined,
          sort: "popular", // Default sort for browsing
        });
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch menu:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchItems, 300);
    return () => clearTimeout(debounce);
  }, [activeCat, search]);

  const handleAddToCart = async (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
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
      showToast("Please login to add to cart.", "error");
    }
  };

  const allCategories = [{ id: 0, name: "All", icon: "restaurant_menu", count: 0 }, ...categories];
  const displayedItems = items;

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <PageTransition>
      <div className="menu-page">
        <Navbar />
        <div className="menu-container">

          {/* Trending Now Section */}
          {trendingItems.length > 0 && activeCat === "All" && !search && (
            <>
              <h2 className="menu-section-title">Trending Now</h2>
              <motion.div
                className="trending-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {trendingItems.map((item, index) => (
                  <motion.div
                    className="trending-card"
                    key={`trending-${item.id}`}
                    onClick={() => navigate(`/menu/${item.id}`)}
                    style={{ cursor: "pointer" }}
                    variants={itemVariants}
                    whileHover={{ boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
                  >
                    <FastImage src={item.image} alt={item.name} />
                    <div className="trending-overlay">
                      <span className="trending-badge">{index === 0 ? "CHEF'S SPECIAL" : "NEW ARRIVAL"}</span>
                      <div className="trending-info">
                        <h3>{item.name}</h3>
                        <p>{item.description || "Fresh and hot, highly recommended."}</p>
                      </div>
                    </div>
                    <button className="trending-add-btn" onClick={(e) => handleAddToCart(e, item.id)}>
                      <span className="material-symbols-rounded">add</span>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}

          {/* Category Navigation & Search */}
          <div className="menu-category-nav">
            <div className="menu-category-pills">
              {allCategories.map((cat) => (
                <button
                  key={cat.name}
                  className={`menu-pill ${activeCat === cat.name ? "active" : ""}`}
                  onClick={() => setActiveCat(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="menu-toolbar-right">
              <div className="menu-search-wrapper">
                <span className="material-symbols-rounded">search</span>
                <input
                  className="menu-search-input"
                  type="text"
                  placeholder="Search menu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Category Header */}
          <div className="category-header-wrap">
            <div className="category-header-info">
              <h2>{activeCat === "All" ? (search ? "Search Results" : "All Items") : activeCat}</h2>
              <p>Hand-crafted and prepared fresh to order.</p>
            </div>
            <div className="category-count-badge">
              {displayedItems.length} items
            </div>
          </div>

          {/* Menu Grid */}
          {loading ? (
            <div className="menu-grid-modern">
              <Skeleton type="card" count={6} />
            </div>
          ) : displayedItems.length > 0 ? (
            <motion.div
              className="menu-grid-modern"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              key={activeCat + search} // Re-animate when category/search changes
            >
              {displayedItems.map((item) => (
                <motion.div
                  className="menu-card-modern"
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
                >
                  <div className="mcm-img-wrapper" onClick={() => navigate(`/menu/${item.id}`)}>
                    <FastImage src={item.image} alt={item.name} />
                    <div className="mcm-price-pill">Rs. {item.price}</div>
                  </div>
                  <div className="mcm-body">
                    <h3 className="mcm-title">{item.name}</h3>
                    <div className="menu-calorie-chip">
                      <span className="material-symbols-rounded" style={{ fontSize: '15px', marginRight: '4px', verticalAlign: 'middle' }}>local_fire_department</span>
                      {item.calories} kcal
                    </div>
                    <p className="mcm-desc">{item.description}</p>

                    <button className="mcm-add-btn" onClick={(e) => handleAddToCart(e, item.id)}>
                      <span className="material-symbols-rounded">shopping_cart</span>
                      Add to Order
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="menu-empty" style={{ textAlign: 'center', padding: '64px', color: '#8b7d72' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '48px', opacity: 0.5 }}>search_off</span>
              <h3 style={{ marginTop: '16px', color: '#2a2420' }}>No items found</h3>
              <p>Try a different search or category.</p>
            </div>
          )}

        </div>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default MenuBrowse;
