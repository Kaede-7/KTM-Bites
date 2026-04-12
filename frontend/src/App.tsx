import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/dashboard";
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

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/kitchen" element={<Kitchen />} />

      {/* Authenticated routes (shown after login) */}
      <Route path="/home" element={<Home />} />
      <Route path="/menu" element={<MenuBrowse />} />
      <Route path="/menu/:id" element={<ItemDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-tracking/:id" element={<OrderTracking />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;
