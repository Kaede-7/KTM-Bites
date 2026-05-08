import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/cart.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingAnimation from "../components/LoadingAnimation";
import { getCart, updateCartItem, removeFromCart, type CartData } from "../api/cart";

const Cart: React.FC = () => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [cartAdded, setCartAdded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
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
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    try {
      const data = await removeFromCart(cartItemId);
      setCart(data);
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
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <div className="cart-empty">
            <span className="material-symbols-rounded">shopping_cart</span>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything yet</p>
            <Link to="/menu" className="cart-empty-btn">
              <span className="material-symbols-rounded">restaurant_menu</span>Browse Menu
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const deliveryFee = 80;
  const total = Number(cart.total) + deliveryFee;

  return (
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
  );
};

export default Cart;
