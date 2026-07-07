import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/cart.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { getCart, updateCartItem, removeFromCart, type CartData } from "../api/cart";
import { isLoggedIn } from "../api/auth";
import PageTransition from "../components/PageTransition";
import LottieAnimation from "../components/LottieAnimation";

const Cart: React.FC = () => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }
    try {
      const data = await getCart();
      setCart(data);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (cartItemId: number, currentQty: number, delta: number) => {
    const newQty = Math.max(1, currentQty + delta);
    try {
      const data = await updateCartItem(cartItemId, newQty);
      setCart(data);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    try {
      const data = await removeFromCart(cartItemId);
      setCart(data);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <LoadingAnimation message="Loading cart..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <PageTransition>
        <div className="cart-page">
          <Navbar />
          <div className="cart-container">
            <div className="cart-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LottieAnimation type="empty-cart" width={300} height={300} />
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added anything yet</p>
              <Link to="/menu" className="cart-empty-btn">
                Browse Menu
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  const deliveryFee = 80;
  const total = Number(cart.total) + deliveryFee;
  const calorieFill = Math.min(cart.calorie_percentage, 100);
  const caloriesRemaining = cart.calorie_target !== null ? Math.max(cart.calorie_target - cart.total_calories, 0) : 0;

  return (
    <PageTransition>
      <div className="cart-page">
      <Navbar />
      <div className="cart-container">
        <h1 className="cart-title"><span className="material-symbols-rounded">shopping_cart</span>Your Cart</h1>
        <p className="cart-count">{cart.item_count} item{cart.item_count !== 1 ? "s" : ""} in your cart</p>

        <div className="cart-layout">
          <div className="cart-items-list">
            {cart.items.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <p className="cart-item-category">{item.category}</p>
                  <p className="cart-item-price">Rs. {item.price}</p>
                  <p className="cart-item-calories">🔥 {item.total_calories} kcal</p>
                </div>
                <div className="cart-item-controls">
                  <div className="cart-item-qty">
                    <button className="cart-item-qty-btn" onClick={() => handleUpdateQty(item.id, item.quantity, -1)}>
                      <span className="material-symbols-rounded">remove</span>
                    </button>
                    <span className="cart-item-qty-value">{item.quantity}</span>
                    <button className="cart-item-qty-btn" onClick={() => handleUpdateQty(item.id, item.quantity, 1)}>
                      <span className="material-symbols-rounded">add</span>
                    </button>
                  </div>
                  <button className="cart-item-remove" onClick={() => handleRemove(item.id)}>
                    <span className="material-symbols-rounded">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>

            {cart.calorie_target !== null ? (
            <div className={`cart-calorie-meter ${cart.calorie_exceeded ? "is-over" : ""}`}>
              <div className="cart-calorie-gauge" aria-hidden="true">
                <div
                  className="cart-calorie-gauge-fill"
                  style={{ height: `${calorieFill}%` }}
                />
                <span
                  className="cart-calorie-gauge-fire"
                  style={{ bottom: `clamp(8px, ${calorieFill}%, calc(100% - 16px))` }}
                >
                  🔥
                </span>
              </div>

              <div className="cart-calorie-details">
                <div className="cart-calorie-heading">
                  <span>Calorie meter</span>
                  <strong>{Math.round(cart.calorie_percentage)}%</strong>
                </div>
                <div className="cart-calorie-value">
                  {cart.total_calories.toLocaleString()}
                  <span> / {cart.calorie_target.toLocaleString()} kcal</span>
                </div>
                <p>
                  {cart.calorie_exceeded
                    ? `${(cart.total_calories - cart.calorie_target).toLocaleString()} kcal over your target`
                    : `${caloriesRemaining.toLocaleString()} kcal remaining`}
                </p>
                <Link to="/profile" className="cart-calorie-edit">
                  Change target
                  <span className="material-symbols-rounded">arrow_forward</span>
                </Link>
              </div>
            </div>
            ) : (
              <Link to="/profile" className="cart-calorie-meter cart-calorie-notset">
                <span className="material-symbols-rounded" style={{ color: '#f28b46' }}>local_fire_department</span>
                <div>
                  <strong>Track calories for this order</strong>
                  <p>No daily goal set — set one in your profile to start tracking.</p>
                </div>
                <span className="material-symbols-rounded">arrow_forward</span>
              </Link>
            )}

            <div className="cart-summary-row"><span>Subtotal</span><span>Rs. {cart.total}</span></div>
            <div className="cart-summary-row"><span>Delivery Fee</span><span>Rs. {deliveryFee}</span></div>

            <div className="cart-summary-divider" />
            <div className="cart-summary-total"><span>Total</span><span>Rs. {total}</span></div>
            <Link to="/checkout">
              <button className="cart-checkout-btn">
                <span className="material-symbols-rounded">shopping_cart_checkout</span>Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Cart;
