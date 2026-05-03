import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/dashboard.css";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";
import Footer from "../components/Footer";

// Combine Categories and Foods for index syncing
const ITEMS = [
  {
    name: "Pizza",
    icon: "local_pizza",
    query: "Pizza",
    src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Burger",
    icon: "lunch_dining",
    query: "Burger",
    src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Drinks",
    icon: "local_cafe",
    query: "Drinks",
    src: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Desserts",
    icon: "cake",
    query: "Desserts",
    src: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Sushi",
    icon: "set_meal",
    query: "Sushi",
    src: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Noodles",
    icon: "ramen_dining",
    query: "Noodles",
    src: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=600&fit=crop&crop=center",
  },
];

// Mock Menu Items for the Menu Section
const MOCK_MENU = [
  {
    id: 1,
    name: "Margherita Pizza",
    cat: "Pizza",
    price: "$12.99",
    img: ITEMS[0].src,
  },
  {
    id: 2,
    name: "Pepperoni Pizza",
    cat: "Pizza",
    price: "$14.99",
    img: ITEMS[0].src,
  },
  {
    id: 3,
    name: "Classic Cheeseburger",
    cat: "Burger",
    price: "$9.99",
    img: ITEMS[1].src,
  },
  {
    id: 4,
    name: "Bacon Double Burger",
    cat: "Burger",
    price: "$12.99",
    img: ITEMS[1].src,
  },
  {
    id: 5,
    name: "Iced Caramel Macchiato",
    cat: "Drinks",
    price: "$4.99",
    img: ITEMS[2].src,
  },
  {
    id: 6,
    name: "Chocolate Lava Cake",
    cat: "Desserts",
    price: "$6.99",
    img: ITEMS[3].src,
  },
  {
    id: 7,
    name: "Spicy Tuna Roll",
    cat: "Sushi",
    price: "$14.99",
    img: ITEMS[4].src,
  },
  {
    id: 8,
    name: "Spicy Miso Ramen",
    cat: "Noodles",
    price: "$13.99",
    img: ITEMS[5].src,
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState<string>("All");
  const [rotation, setRotation] = useState(0);

  const currentRotation = useRef(0);
  const targetRotation = useRef<number | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (targetRotation.current !== null) {
        const diff = targetRotation.current - currentRotation.current;
        if (Math.abs(diff) < 0.5) {
          currentRotation.current = targetRotation.current;
          targetRotation.current = null;
        } else {
          // Ease towards target
          currentRotation.current += diff * 5 * delta;
        }
      } else {
        // Continuous slow spin
        currentRotation.current += 15 * delta; // 15 degrees/sec
      }

      setRotation(currentRotation.current);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleCategoryClick = (index: number, catName: string) => {
    setActiveCat(catName);

    // Calculate target angle to bring this item to the "front" (left side of the circle)
    // The front is at 270 degrees relative to top (translateY)
    let target = 270 - index * 60;

    const current = currentRotation.current;
    const normalizedCurrent = current % 360;
    let diff = target - normalizedCurrent;

    // Shortest path
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    targetRotation.current = current + diff;

    // Smooth scroll to menu section
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredMenu =
    activeCat === "All"
      ? MOCK_MENU
      : MOCK_MENU.filter((item) => item.cat === activeCat);

  return (
    <div className="lp">
      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-logo-link">
          <img src={transparentLogo} alt="KTM Bites" className="lp-logo-img" />
        </Link>
        <div className="lp-nav-links">
          <a href="#menu" className="lp-link">
            Menu
          </a>
          <a href="#offers" className="lp-link">
            Offers
          </a>
          <Link to="/order-tracking/latest" className="lp-link">
            Tracking
          </Link>
          <a href="#support" className="lp-link">
            Support
          </a>
        </div>
        <div className="lp-nav-right">
          <button
            className="lp-nav-icon"
            onClick={() => navigate("/cart")}
            aria-label="Cart"
          >
            <span className="material-symbols-rounded">shopping_cart</span>
          </button>
          <button className="lp-nav-icon" aria-label="Notifications">
            <span className="material-symbols-rounded">notifications</span>
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="lp-hero">
        {/* Giant rotating food wheel */}
        <div className="lp-wheel-wrap">
          <div
            className="lp-wheel"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {ITEMS.map((f, i) => (
              <div
                key={f.name}
                className="lp-slot"
                style={{
                  transform: `rotate(${i * 60}deg) translateY(-380px) rotate(${-i * 60}deg)`,
                }}
              >
                <div
                  className={`lp-plate ${activeCat === f.name ? "active" : ""}`}
                  style={{ transform: `rotate(${-rotation}deg)` }}
                >
                  <img src={f.src} alt={f.name} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left copy */}
        <div className="lp-copy">
          <span className="lp-badge">NEW SEASONAL MENU</span>
          <h1 className="lp-title">
            Crave the
            <br />
            <em>Extraordinary</em>
          </h1>
          <p className="lp-desc">
            Dive into our dynamic rotation of flavors. Fast, fresh, and
            delivered right to your door with a visual feast.
          </p>
          <button
            className="lp-order-btn"
            onClick={() =>
              document
                .getElementById("menu")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Order Now
            <span className="material-symbols-rounded lp-arr">
              arrow_forward
            </span>
          </button>

          <div className="lp-cats">
            {ITEMS.map((c, i) => (
              <button
                key={c.name}
                className={`lp-chip ${activeCat === c.name ? "active" : ""}`}
                onClick={() => handleCategoryClick(i, c.name)}
              >
                <span className="material-symbols-rounded lp-chip-ic">
                  {c.icon}
                </span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MENU SECTION ───────────────────────────────── */}
      <section id="menu" className="lp-menu-section">
        <div className="lp-menu-container">
          <h2 className="lp-menu-title">Featured Menu</h2>

          <div className="lp-menu-filters">
            <button
              className={`lp-menu-filter ${activeCat === "All" ? "active" : ""}`}
              onClick={() => setActiveCat("All")}
            >
              All
            </button>
            {ITEMS.map((c) => (
              <button
                key={c.name}
                className={`lp-menu-filter ${activeCat === c.name ? "active" : ""}`}
                onClick={() => setActiveCat(c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="lp-menu-grid">
            {filteredMenu.map((item) => (
              <div key={item.id} className="lp-menu-card">
                <img
                  src={item.img}
                  alt={item.name}
                  className="lp-menu-card-img"
                />
                <div className="lp-menu-card-info">
                  <h3>{item.name}</h3>
                  <span className="lp-menu-card-cat">{item.cat}</span>
                  <div className="lp-menu-card-bottom">
                    <span className="lp-menu-card-price">{item.price}</span>
                    <button
                      className="lp-menu-card-btn"
                      onClick={() => navigate("/cart")}
                    >
                      <span className="material-symbols-rounded">
                        add_shopping_cart
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMenu.length === 0 && (
            <p className="lp-menu-empty">No items found for {activeCat}.</p>
          )}

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <button className="lp-order-btn" onClick={() => navigate("/menu")}>
              View Full Menu{" "}
              <span className="material-symbols-rounded lp-arr">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── MINIMAL FOOTER ─────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-left">
          <span className="lp-footer-brand">KTMBites</span>
          <span className="lp-footer-copy">
            © 2024 KTMBites. All rights reserved.
          </span>
        </div>
        <div className="lp-footer-right">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
