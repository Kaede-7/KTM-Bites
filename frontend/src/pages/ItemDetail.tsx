import React, { useState, useEffect } from "react";
import PageTransition from "../components/PageTransition";
import { useParams, useNavigate } from "react-router-dom";
import "../css/item-detail.css";
import "../css/menu.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Skeleton from "../components/Skeleton";
import FastImage from "../components/FastImage";
import { getMenuItem, type MenuItemDetailData } from "../api/menu";
import { addToCart } from "../api/cart";
import { isLoggedIn } from "../api/auth";
import { useToast } from "../components/Toast";

// ── Macros Estimation Helper ────────────────────────────────────
interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

function estimateMacros(calories: number, name: string = "", category: string = ""): Macros {
  const normName = name.toLowerCase();
  const normCat = category.toLowerCase();
  
  let pPct = 0.20; // 20% protein calories
  let cPct = 0.50; // 50% carbs calories
  let fPct = 0.30; // 30% fat calories
  
  if (normCat.includes("salad") || normCat.includes("healthy") || normName.includes("salad") || normName.includes("keto")) {
    pPct = 0.30;
    cPct = 0.35;
    fPct = 0.35;
  } else if (normCat.includes("dessert") || normCat.includes("sweet") || normCat.includes("bakery") || normName.includes("cake") || normName.includes("muffin") || normName.includes("pancake")) {
    pPct = 0.08;
    cPct = 0.62;
    fPct = 0.30;
  } else if (normName.includes("chicken") || normName.includes("buff") || normName.includes("meat") || normName.includes("steak") || normName.includes("fish")) {
    pPct = 0.35;
    cPct = 0.35;
    fPct = 0.30;
  }
  
  const pKcal = calories * pPct;
  const cKcal = calories * cPct;
  const fKcal = calories * fPct;
  
  return {
    protein: Math.round(pKcal / 4),
    carbs: Math.round(cKcal / 4),
    fat: Math.round(fKcal / 9),
  };
}

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
      window.dispatchEvent(new Event("cart-updated"));
      showToast(`${qty}× ${item.name} added to cart!`, "success");
    } catch (err) {
      showToast("Failed to add to cart. Please try again.", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleRelatedAddToCart = async (e: React.MouseEvent, relatedId: number, relatedName: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    try {
      await addToCart(relatedId, 1);
      window.dispatchEvent(new Event("cart-updated"));
      showToast(`${relatedName} added to cart!`, "success");
    } catch (err) {
      showToast("Failed to add to cart. Please try again.", "error");
    }
  };

  if (loading || !item) {
    return (
      <div className="item-detail-page">
        <Navbar />
        <div className="item-detail-container">
          <Skeleton type="card" />
        </div>
        <Footer />
      </div>
    );
  }

  const macros = estimateMacros(item.calories, item.name, item.category_name || item.category);

  return (
    <PageTransition>
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
            <span className="item-detail-category">{item.category_name || item.category}</span>
            <h1 className="item-detail-name">{item.name}</h1>

            <div className="item-detail-rating-row">
              <span className="item-detail-rating">
                <span className="material-symbols-rounded">star</span>{item.rating}
              </span>
              <span className="item-detail-reviews">({item.reviews} reviews)</span>
            </div>

            <p className="item-detail-desc">{item.description}</p>

            <div className="item-detail-calorie-card">
              <div className="idc-top">
                <span className="material-symbols-rounded">local_fire_department</span>
                <div className="idc-kcal">
                  <strong>{(item.calories * qty).toLocaleString()} kcal</strong>
                  <span>{item.calories} kcal per item</span>
                </div>
              </div>
              
              {/* Macro items */}
              <div className="item-detail-macros">
                <div className="item-detail-macro-card">
                  <span className="material-symbols-rounded" style={{ color: '#ef4444' }}>egg</span>
                  <div className="item-detail-macro-info">
                    <span className="macro-name">Protein</span>
                    <span className="macro-val">{macros.protein * qty}g</span>
                  </div>
                </div>
                <div className="item-detail-macro-card">
                  <span className="material-symbols-rounded" style={{ color: '#3b82f6' }}>grain</span>
                  <div className="item-detail-macro-info">
                    <span className="macro-name">Carbs</span>
                    <span className="macro-val">{macros.carbs * qty}g</span>
                  </div>
                </div>
                <div className="item-detail-macro-card">
                  <span className="material-symbols-rounded" style={{ color: '#eab308' }}>opacity</span>
                  <div className="item-detail-macro-info">
                    <span className="macro-name">Fat</span>
                    <span className="macro-val">{macros.fat * qty}g</span>
                  </div>
                </div>
              </div>
            </div>

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
                {adding ? "Adding..." : `Add to Cart — Rs. ${(item.price * qty).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>

        {item.related && item.related.length > 0 && (
          <div className="item-detail-related">
            <h2>You might also like</h2>
            <div className="menu-grid-modern">
              {item.related.map((r) => (
                <div key={r.id} className="menu-card-modern" onClick={() => navigate(`/menu/${r.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="mcm-img-wrapper">
                    <FastImage src={r.image} alt={r.name} />
                    <div className="mcm-price-pill">Rs. {r.price}</div>
                  </div>
                  <div className="mcm-body">
                    <span className="item-detail-category" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>
                      {r.category_name || r.category}
                    </span>
                    <h3 className="mcm-title" style={{ fontSize: '16px', margin: '4px 0 6px 0' }}>{r.name}</h3>
                    <div className="menu-calorie-chip" style={{ marginBottom: '16px' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '15px', marginRight: '4px', verticalAlign: 'middle' }}>local_fire_department</span>
                      {r.calories} kcal
                    </div>
                    <p className="mcm-desc" style={{ marginBottom: '20px' }}>{r.description}</p>

                    <button className="mcm-add-btn" onClick={(e) => handleRelatedAddToCart(e, r.id, r.name)}>
                      <span className="material-symbols-rounded">shopping_cart</span>
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default ItemDetail;
