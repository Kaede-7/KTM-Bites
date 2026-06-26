import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCart, type CartData } from "../api/cart";
import { isLoggedIn } from "../api/auth";
import "../css/calorie-tracker.css";

const HIDDEN_PREFIXES = ["/login", "/signup", "/admin", "/kitchen", "/rider"];

export default function CalorieTracker() {
  const location = useLocation();
  const [cart, setCart] = useState<CartData | null>(null);
  const hidden = HIDDEN_PREFIXES.some((path) => location.pathname.startsWith(path));

  const refresh = useCallback(() => {
    if (!isLoggedIn("user")) {
      setCart(null);
      return;
    }
    getCart().then(setCart).catch(() => setCart(null));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, [refresh, location.pathname]);

  if (hidden || !cart) return null;

  const markerPosition = Math.min(cart.calorie_percentage, 100);
  const fillPosition = Math.min(cart.calorie_percentage, 100);
  const markerEdge =
    markerPosition <= 8 ? "at-start" : markerPosition >= 92 ? "at-end" : "";

  return (
    <div
      className={`calorie-tracker ${cart.calorie_exceeded ? "is-over" : ""}`}
      aria-label={`${cart.total_calories} of ${cart.calorie_target} calories in cart`}
    >
      <div className="calorie-track">
        <div className="calorie-track-fill" style={{ width: `${fillPosition}%` }} />
        <Link
          to="/cart"
          className={`calorie-runner ${markerEdge}`}
          style={{ left: `clamp(15px, ${markerPosition}%, calc(100% - 15px))` }}
          aria-label="View calorie details in cart"
        >
          <span className="calorie-emoji">🔥</span>
          <span className="calorie-tooltip" role="tooltip">
            <strong>{cart.total_calories} / {cart.calorie_target} kcal</strong>
            <span>{Math.round(cart.calorie_percentage)}% of your target</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
