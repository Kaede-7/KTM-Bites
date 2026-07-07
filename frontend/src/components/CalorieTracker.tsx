import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCart, type CartData } from "../api/cart";
import { isLoggedIn } from "../api/auth";

// ── Calorie Context ────────────────────────────────────────────
export interface CalorieState {
  cart: CartData | null;
  isLoading: boolean;
  refresh: () => void;
}

export const CalorieContext = createContext<CalorieState>({ cart: null, isLoading: true, refresh: () => {} });

export function useCalorie() {
  return useContext(CalorieContext);
}

const HIDDEN_PREFIXES = ["/login", "/signup", "/admin", "/kitchen", "/rider"];

// Provider — keeps the cart calorie data fresh globally.
// No visual output; the Navbar dropdown is the UI.
export function CalorieProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hidden = HIDDEN_PREFIXES.some((path) => location.pathname.startsWith(path));

  const refresh = useCallback(() => {
    if (!isLoggedIn("user") || hidden) {
      setCart(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getCart()
      .then((data) => { setCart(data); setIsLoading(false); })
      .catch(() => { setCart(null); setIsLoading(false); });
  }, [hidden]);

  useEffect(() => {
    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, [refresh, location.pathname]);

  return (
    <CalorieContext.Provider value={{ cart, isLoading, refresh }}>
      {children}
    </CalorieContext.Provider>
  );
}

// Legacy default export (kept for any direct imports) — now a no-op visual.
// The bottom progress bar was replaced by the Navbar calorie dropdown.
export default function CalorieTracker() {
  return null;
}
