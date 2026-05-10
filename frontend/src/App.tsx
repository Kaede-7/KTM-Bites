import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ChatWidget from "./components/ChatWidget";
import { ToastProvider } from "./components/Toast";
import AuthLayout from "./components/AuthLayout";
import LoadingAnimation from "./components/LoadingAnimation";

// Lazy load pages
const LandingPage = lazy(() => import("./pages/dashboard"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const MenuBrowse = lazy(() => import("./pages/MenuBrowse"));
const ItemDetail = lazy(() => import("./pages/ItemDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const Kitchen = lazy(() => import("./pages/Kitchen"));
const Rider = lazy(() => import("./pages/Rider"));

function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<LoadingAnimation message="Entering the kitchen..." />}>
        <Routes>
          {/* === Public routes (anyone can see) === */}
          <Route path="/" element={<LandingPage />} />

          {/* Login & Signup share a common layout (AuthLayout wraps them) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Admin, Kitchen, and Rider have their own login systems */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/rider" element={<Rider />} />

          {/* === Routes that require login === */}
          <Route path="/home" element={<Home />} />
          <Route path="/menu" element={<MenuBrowse />} />
          <Route path="/menu/:id" element={<ItemDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-tracking/:id" element={<OrderTracking />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>

      {/* AI Chat Widget — floating button on every page */}
      <ChatWidget />
    </ToastProvider>
  );
}

export default App;


