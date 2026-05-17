import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "../api/auth";
import { useToast } from "./Toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuth = isLoggedIn('user');
  const location = useLocation();
  const { showToast } = useToast();

  const hasToasted = React.useRef(false);

  useEffect(() => {
    if (!isAuth && !hasToasted.current) {
      // Determine a friendly message based on the destination
      let message = "Please sign in to access your account.";
      if (location.pathname.includes("cart")) {
        message = "Unlock your cravings! Please log in to view your cart.";
      } else if (location.pathname.includes("order-tracking")) {
        message = "Sign in to track your delicious bites in real-time.";
      } else if (location.pathname.includes("checkout")) {
        message = "Just one step away! Log in to complete your order.";
      } else if (location.pathname.includes("profile")) {
        message = "Access your profile and preferences by signing in.";
      }

      showToast(message, "info");
      hasToasted.current = true;
    }
  }, [isAuth, location, showToast]);

  if (!isAuth) {
    // Redirect to login, but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
