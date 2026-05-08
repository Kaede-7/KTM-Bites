import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/dashboard.css";
import Navbar from "../components/Navbar";

const ITEMS = [
  {
    name: "Pizza",
    icon: "local_pizza",
    tagline: "Wood-fired & perfectly crisp",
    src: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Burger",
    icon: "lunch_dining",
    tagline: "Stacked, juicy & handcrafted",
    src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Drinks",
    icon: "local_cafe",
    tagline: "Fresh, bold & refreshing",
    src: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Desserts",
    icon: "cake",
    tagline: "Sweet indulgence, every bite",
    src: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Sushi",
    icon: "set_meal",
    tagline: "Fresh rolls, authentic flavors",
    src: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&h=600&fit=crop&crop=center",
  },
  {
    name: "Noodles",
    icon: "ramen_dining",
    tagline: "Rich broth, bold umami",
    src: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=600&fit=crop&crop=center",
  },
];

const STEP_MS = 3000;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  const currentRotation = useRef(0);
  const targetRotation = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHoveredRef = useRef(false);

  // Track window size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    activeIndexRef.current = index;
    const target = 270 - index * 60;
    const current = currentRotation.current;
    const norm = ((current % 360) + 360) % 360;
    let diff = target - norm;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    targetRotation.current = current + diff;
  }, []);

  const startAutoStep = useCallback(() => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      if (isHoveredRef.current) return;
      const next = (activeIndexRef.current + 1) % ITEMS.length;
      goToIndex(next);
    }, STEP_MS);
  }, [goToIndex]);

  // Animation loop — only run on desktop
  useEffect(() => {
    if (isMobile) return;
    let rafId: number;
    let last = performance.now();
    const animate = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.1);
      last = t;
      if (targetRotation.current !== null) {
        const diff = targetRotation.current - currentRotation.current;
        if (Math.abs(diff) < 0.08) {
          currentRotation.current = targetRotation.current;
          targetRotation.current = null;
        } else {
          currentRotation.current += diff * 5 * dt;
        }
      }
      setRotation(currentRotation.current);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isMobile]);

  // Auto-step
  useEffect(() => {
    goToIndex(0);
    startAutoStep();
    return () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current); };
  }, [goToIndex, startAutoStep]);

  const handleCategoryClick = (index: number, catName: string) => {
    goToIndex(index);
    startAutoStep();
    setTimeout(() => navigate(`/menu?category=${encodeURIComponent(catName)}`), 650);
  };

  const prevItem = () => {
    const prev = (activeIndexRef.current - 1 + ITEMS.length) % ITEMS.length;
    goToIndex(prev);
    startAutoStep();
  };

  const nextItem = () => {
    const next = (activeIndexRef.current + 1) % ITEMS.length;
    goToIndex(next);
    startAutoStep();
  };

  const activeItem = ITEMS[activeIndex];

  return (
    <div className="lp">
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="lp-hero">

        {/* ── Desktop only: spin wheel ─────────────────────────── */}
        {!isMobile && (
          <>
            <div
              className="lp-wheel-wrap"
              onMouseEnter={() => { isHoveredRef.current = true; }}
              onMouseLeave={() => { isHoveredRef.current = false; }}
            >
              <div className="lp-orbit-ring lp-orbit-ring--outer" />
              <div className="lp-orbit-ring lp-orbit-ring--inner" />

              <div className="lp-wheel" style={{ transform: `rotate(${rotation}deg)` }}>
                {ITEMS.map((f, i) => (
                  <div
                    key={f.name}
                    className="lp-slot"
                    style={{ transform: `rotate(${i * 60}deg) translateY(-450px) rotate(${-i * 60}deg)` }}
                  >
                    <button
                      className={`lp-plate ${activeIndex === i ? "active" : ""}`}
                      style={{ transform: `rotate(${-rotation}deg)` }}
                      onClick={() => handleCategoryClick(i, f.name)}
                      aria-label={`Browse ${f.name}`}
                      title={f.name}
                    >
                      <img src={f.src} alt={f.name} />
                      <div className="lp-plate-overlay" />
                      <span className="lp-plate-label">
                        <span className="material-symbols-rounded">{f.icon}</span>
                        {f.name}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Wheel controls */}
            <div className="lp-wheel-controls">
              <button className="lp-wheel-arrow" onClick={prevItem} aria-label="Previous">
                <span className="material-symbols-rounded">chevron_left</span>
              </button>
              <div className="lp-wheel-dots">
                {ITEMS.map((f, i) => (
                  <button
                    key={f.name}
                    className={`lp-wheel-dot ${activeIndex === i ? "active" : ""}`}
                    onClick={() => { goToIndex(i); startAutoStep(); }}
                    aria-label={`Go to ${f.name}`}
                  />
                ))}
              </div>
              <button className="lp-wheel-arrow" onClick={nextItem} aria-label="Next">
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
          </>
        )}

        {/* ── Copy (always visible) ───────────────────────────── */}
        <div className="lp-copy">
          <h1 className="lp-title">
            Crave the<br />
            <em>Extraordinary</em>
          </h1>

          {/* Dynamic active category card */}
          <div className="lp-active-cat" key={activeIndex}>
            <span className="material-symbols-rounded lp-active-cat-icon">{activeItem.icon}</span>
            <div className="lp-active-cat-text">
              <span className="lp-active-cat-name">{activeItem.name}</span>
              <span className="lp-active-cat-tagline">{activeItem.tagline}</span>
            </div>
            <span className="material-symbols-rounded lp-active-cat-arrow">arrow_forward</span>
          </div>

          <p className="lp-desc">
            Dive into our dynamic rotation of flavors. Fast, fresh, and
            delivered right to your door.
          </p>

          <button className="lp-order-btn" onClick={() => navigate("/menu")}>
            Order Now
            <span className="material-symbols-rounded lp-arr">arrow_forward</span>
          </button>

          {/* Category chips */}
          <div className="lp-cats">
            {ITEMS.map((c, i) => (
              <button
                key={c.name}
                className={`lp-chip ${activeIndex === i ? "active" : ""}`}
                onClick={() => handleCategoryClick(i, c.name)}
                title={`Browse ${c.name}`}
              >
                <span className="material-symbols-rounded lp-chip-ic">{c.icon}</span>
                {c.name}
                <span className="lp-chip-arrow material-symbols-rounded">arrow_forward</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Mobile / Tablet: horizontal food card strip ──────── */}
        {isMobile && (
          <div className="lp-mobile-showcase">
            <div className="lp-mobile-scroll">
              {ITEMS.map((item, i) => (
                <button
                  key={item.name}
                  className={`lp-mobile-card ${activeIndex === i ? "active" : ""}`}
                  onClick={() => handleCategoryClick(i, item.name)}
                  aria-label={`Browse ${item.name}`}
                >
                  <img src={item.src} alt={item.name} />
                  <div className="lp-mobile-card-overlay" />
                  <div className="lp-mobile-card-label">
                    <span className="material-symbols-rounded">{item.icon}</span>
                    {item.name}
                  </div>
                </button>
              ))}
            </div>
            {/* Dot indicators */}
            <div className="lp-mobile-dots">
              <button className="lp-mobile-arrow" onClick={prevItem} aria-label="Previous">
                <span className="material-symbols-rounded">chevron_left</span>
              </button>
              <div className="lp-wheel-dots">
                {ITEMS.map((f, i) => (
                  <button
                    key={f.name}
                    className={`lp-wheel-dot ${activeIndex === i ? "active" : ""}`}
                    onClick={() => { goToIndex(i); startAutoStep(); }}
                    aria-label={`Go to ${f.name}`}
                  />
                ))}
              </div>
              <button className="lp-mobile-arrow" onClick={nextItem} aria-label="Next">
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-left">
          <span className="lp-footer-brand">KTMBites</span>
          <span className="lp-footer-copy">© 2026 KTMBites. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
