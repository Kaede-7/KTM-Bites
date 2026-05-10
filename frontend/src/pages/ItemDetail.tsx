import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../css/item-detail.css";
import "../css/menu.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import FastImage from "../components/FastImage";
import { getMenuItem, type MenuItemDetailData } from "../api/menu";
import { addToCart } from "../api/cart";
import { isLoggedIn } from "../api/auth";
import { useToast } from "../components/Toast";

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [qty, setQty] = useState(1);
  const [item, setItem] = useState<MenuItemDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const data = await getMenuItem(Number(id));
        setItem(data);
      } catch (err) {
        console.error("Failed to fetch item:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    if (!item) return;
    setAdding(true);
    try {
      await addToCart(item.id, qty);
      showToast(`${qty}× ${item.name} added to cart!`, "success");
    } catch (err) {
      showToast("Failed to add to cart. Please try again.", "error");
    } finally {
      setAdding(false);
    }
  };

  if (loading || !item) {
    return (
      <div className="item-detail-page">
        <Navbar />
        <div className="item-detail-container">
          <LoadingAnimation message="Loading items..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="item-detail-page">
      <Navbar />
      <div className="item-detail-container">
        <button className="item-detail-back" onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>Back to menu
        </button>

        <div className="item-detail-content">
          <div className="item-detail-image-section">
            <FastImage src={item.image} alt={item.name} className="item-detail-main-image" />
            {item.badge && <span className="item-detail-badge">{item.badge}</span>}
          </div>

          <div className="item-detail-info">
            <span className="item-detail-category">{item.category}</span>
            <h1 className="item-detail-name">{item.name}</h1>

            <div className="item-detail-rating-row">
              <span className="item-detail-rating">
                <span className="material-symbols-rounded">star</span>{item.rating}
              </span>
              <span className="item-detail-reviews">({item.reviews} reviews)</span>
              <span className="item-detail-time">
                <span className="material-symbols-rounded">schedule</span>{item.time}
              </span>
            </div>

            <p className="item-detail-desc">{item.description}</p>

            <div className="item-detail-price">
              Rs. {item.price}
              {item.old_price && <span>Rs. {item.old_price}</span>}
            </div>

            <div className="item-detail-actions">
              <div className="item-detail-qty">
                <span className="item-detail-qty-label">Quantity:</span>
                <div className="item-detail-qty-controls">
                  <button className="item-detail-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>
                    <span className="material-symbols-rounded">remove</span>
                  </button>
                  <div className="item-detail-qty-value">{qty}</div>
                  <button className="item-detail-qty-btn" onClick={() => setQty(qty + 1)}>
                    <span className="material-symbols-rounded">add</span>
                  </button>
                </div>
              </div>
              <button className="item-detail-add-btn" onClick={handleAddToCart} disabled={adding}>
                <span className="material-symbols-rounded">shopping_cart</span>
                {adding ? "Adding..." : `Add to Cart — Rs. ${item.price * qty}`}
              </button>
            </div>
          </div>
        </div>

        {item.related && item.related.length > 0 && (
          <div className="item-detail-related">
            <h2>You might also like</h2>
            <div className="item-detail-related-grid">
              {item.related.map((r) => (
                <Link to={`/menu/${r.id}`} key={r.id} className="food-card">
                  <div className="food-card-image-wrapper">
                    <FastImage src={r.image} alt={r.name} className="food-card-image" />
                  </div>
                  <div className="food-card-body">
                    <p className="food-card-category">{r.category}</p>
                    <h3 className="food-card-name">{r.name}</h3>
                    <div className="food-card-footer">
                      <span className="food-card-price">Rs. {r.price}</span>
                      <span className="food-card-rating"><span className="material-symbols-rounded">star</span>{r.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ItemDetail;
