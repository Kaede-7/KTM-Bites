// ============================================================
// App.tsx — The main router of the application
// ============================================================
// This file defines which PAGE component to show for each URL.
// Think of it as a map: URL → Page
//
// Example: When user visits "/menu", React renders <MenuBrowse />
// The <ChatWidget /> is placed outside <Routes> so it appears on ALL pages.
// ============================================================

import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/dashboard";
import ChatWidget from "./components/ChatWidget";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MenuBrowse from "./pages/MenuBrowse";
import ItemDetail from "./pages/ItemDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Kitchen from "./pages/Kitchen";
import AuthLayout from "./components/AuthLayout";

function App() {
  return (
    <>
      <Routes>
        {/* === Public routes (anyone can see) === */}
        <Route path="/" element={<LandingPage />} />

        {/* Login & Signup share a common layout (AuthLayout wraps them) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Admin and Kitchen have their own login systems */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/kitchen" element={<Kitchen />} />

        {/* === Routes that require login === */}
        <Route path="/home" element={<Home />} />
        <Route path="/menu" element={<MenuBrowse />} />
        <Route path="/menu/:id" element={<ItemDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-tracking/:id" element={<OrderTracking />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

      {/* AI Chat Widget — floating button on every page */}
      <ChatWidget />
    </>
  );
}

export default App;
