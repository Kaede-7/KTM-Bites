import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../css/menu.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { getMenuItems, getCategories, type MenuItemData, type CategoryData } from "../api/menu";
import { addToCart } from "../api/cart";
import { isLoggedIn } from "../api/auth";

const MenuBrowse: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("category") || "All";
  const initialSearch = searchParams.get("search") || "";

  const [activeCat, setActiveCat] = useState(initialCat);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("popular");
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);


  // Fetch categories on mount
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch items when filters change
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const data = await getMenuItems({
          category: activeCat !== "All" ? activeCat : undefined,
          search: search || undefined,
          sort,
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
  }, [activeCat, search, sort]);

  const handleAddToCart = async (e: React.MouseEvent, itemId: number) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      window.location.href = "/login";
      return;
    }
    try {
      await addToCart(itemId, 1);
      alert("Added to cart!");
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const allCategories = [{ id: 0, name: "All", icon: "apps", count: 0 }, ...categories];
  const displayedItems = items;

  return (
    <div className="menu-page">
      <Navbar />
      <div className="menu-container">
        <div className="menu-hero">
          <h1>Our Menu</h1>
          <p>Discover delicious food from Kathmandu's finest kitchens</p>
        </div>

        <div className="menu-toolbar">
          <div className="menu-search-wrapper">
            <span className="material-symbols-rounded">search</span>
            <input className="menu-search-input" type="text" placeholder="Search for food..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="menu-sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>

          </select>
        </div>

        <div className="menu-categories">
          {allCategories.map((cat) => (
            <button key={cat.name} className={`category-chip ${activeCat === cat.name ? "active" : ""}`} onClick={() => setActiveCat(cat.name)}>
              <span className="material-symbols-rounded">{cat.icon}</span>{cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingAnimation message="Loading menu..." />
        ) : displayedItems.length > 0 ? (
          <div className="menu-grid">
            {displayedItems.map((item) => (
              <Link to={`/menu/${item.id}`} key={item.id} className="food-card">
                <div className="food-card-image-wrapper">
                  <img src={item.image} alt={item.name} className="food-card-image" />
                  {item.badge && <span className="food-card-badge">{item.badge}</span>}
                </div>
                <div className="food-card-body">
                  <p className="food-card-category">{item.category}</p>
                  <h3 className="food-card-name">{item.name}</h3>
                  <p className="food-card-desc">{item.description}</p>
                  <div className="food-card-footer">
                    <div>
                      <span className="food-card-price">Rs. {item.price}</span>
                      <span className="food-card-rating">
                        <span className="material-symbols-rounded">star</span>{item.rating}
                      </span>
                    </div>
                    <button className="food-card-add-btn" onClick={(e) => handleAddToCart(e, item.id)}>
                      <span className="material-symbols-rounded">add</span>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="menu-empty">
            <span className="material-symbols-rounded">search_off</span>
            <h3>No items found</h3>
            <p>Try a different search or category</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MenuBrowse;
