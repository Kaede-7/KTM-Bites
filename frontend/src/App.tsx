import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ChatWidget from "./components/ChatWidget";
import { ToastProvider } from "./components/Toast";
import { ConfirmDialogProvider } from "./components/ConfirmDialog";
import AuthLayout from "./components/AuthLayout";
import LoadingAnimation from "./components/LoadingAnimation";
import ProtectedRoute from "./components/ProtectedRoute";
import { CalorieProvider } from "./components/CalorieTracker";

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
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Kitchen = lazy(() => import("./pages/Kitchen"));
const Rider = lazy(() => import("./pages/Rider"));
const Cashier = lazy(() => import("./pages/Cashier"));
const CashierLogin = lazy(() => import("./pages/CashierLogin"));
const RiderProfile = lazy(() => import("./pages/RiderProfile"));
const RiderSignup = lazy(() => import("./pages/RiderSignup"));
const RiderLogin = lazy(() => import("./pages/RiderLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Groups = lazy(() => import("./pages/Groups"));

function App() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const isCashierPage = location.pathname.startsWith("/cashier");

  return (
    <ToastProvider>
    <ConfirmDialogProvider>
    <CalorieProvider>
      <Suspense fallback={<LoadingAnimation message="Entering the kitchen..." />}>
        <Routes>
          {/* === Public routes (anyone can see) === */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/menu" element={<MenuBrowse />} />
          <Route path="/menu/:id" element={<ItemDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />

          {/* Login & Signup share a common layout (AuthLayout wraps them) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/rider-login" element={<RiderLogin />} />
            <Route path="/rider-signup" element={<RiderSignup />} />
            <Route path="/cashier-login" element={<CashierLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Admin, Kitchen, Rider, and Cashier have their own login systems */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/rider" element={<Rider />} />
          <Route path="/rider/profile" element={<RiderProfile />} />
          <Route path="/cashier" element={<Cashier />} />

          {/* === Routes that require login === */}
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-tracking/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/groups/:code" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        </Routes>
      </Suspense>

      {/* AI Chat Widget — floating button on every page except landing page and the cashier POS */}
      {!isLandingPage && !isCashierPage && <ChatWidget />}
    </CalorieProvider>
    </ConfirmDialogProvider>
    </ToastProvider>
  );
}

export default App;
