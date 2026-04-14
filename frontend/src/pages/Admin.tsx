import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/admin.css";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";
import * as adminAPI from "../api/admin";
import * as authAPI from "../api/auth";
import LoadingAnimation from "../components/LoadingAnimation";

interface MenuItem {
  id?: number;
  name: string;
  category?: string | number;
  price: number;
  old_price?: number;
  rating?: number;
  reviews?: number;
  time?: string;
  image: string;
  description?: string;
  badge?: string;
  is_available?: boolean;
}

interface Order {
  id: number;
  order_id: string;
  user?: string;
  status: string;
  status_display?: string;
  payment_method: string;
  full_name: string;
  phone: string;
  address: string;
  total: number;
  items?: any[];
  created_at: string;
}

interface Category {
  id?: number;
  name: string;
  icon?: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentSection, setCurrentSection] = useState<string>("dashboard");

  // Menu Items State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<MenuItem>({
    name: "",
    category: 1,
    price: 0,
    image: "",
    description: "",
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);

  // Users State
  const [users, setUsers] = useState<User[]>([]);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn, currentSection]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError("");
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (currentSection === "dashboard") {
        const [menuData, categoryData, orderData, userData] = await Promise.all([
          adminAPI.fetchMenuItems(),
          adminAPI.fetchCategories(),
          adminAPI.fetchAllOrders(),
          adminAPI.fetchAllUsers(),
        ]);
        setMenuItems(menuData);
        setCategories(categoryData);
        setOrders(orderData);
        setUsers(userData);
      } else if (currentSection === "menu") {
        const [menuData, categoryData] = await Promise.all([
          adminAPI.fetchMenuItems(),
          adminAPI.fetchCategories(),
        ]);
        setMenuItems(menuData);
        setCategories(categoryData);
      } else if (currentSection === "orders") {
        const orderData = await adminAPI.fetchAllOrders();
        setOrders(orderData);
      } else if (currentSection === "users") {
        const userData = await adminAPI.fetchAllUsers();
        setUsers(userData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);

    try {
      // Authenticate with backend using the provided credentials
      const response = await authAPI.login(email, password);

      // Check if user is admin (superuser or staff)
      if (!response.user.is_superuser && !response.user.is_staff) {
        throw new Error("Admin access denied. User is not an administrator.");
      }

      setAdminUser(response.user);
      setIsLoggedIn(true);
      setCurrentSection("dashboard");
      setSuccessMessage("Admin login successful! Welcome to Admin Panel.");
    } catch (err: any) {
      setError(
        err.message || "Invalid email or password. Admin access denied.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminUser(null);
    setCurrentSection("dashboard");
    setEmail("");
    setPassword("");
    setError("");
    setSuccessMessage("");
    authAPI.logout(); // Also clear the backend auth
  };

  const handleAddMenuItem = () => {
    setEditingMenuItem(null);
    setMenuForm({
      name: "",
      category: 1,
      price: 0,
      image: "",
      description: "",
    });
    setShowMenuModal(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuForm(item);
    setShowMenuModal(true);
  };

  const handleSaveMenuItem = async () => {
    try {
      setActionLoading(true);
      if (editingMenuItem && editingMenuItem.id) {
        await adminAPI.updateMenuItem(editingMenuItem.id, menuForm);
        setSuccessMessage("Menu item updated successfully!");
      } else {
        await adminAPI.createMenuItem(menuForm);
        setSuccessMessage("Menu item created successfully!");
      }
      setShowMenuModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save menu item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      setActionLoading(true);
      await adminAPI.deleteMenuItem(id);
      setSuccessMessage("Menu item deleted successfully!");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete menu item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: string,
  ) => {
    try {
      setActionLoading(true);
      await adminAPI.updateOrderStatus(orderId, newStatus);
      setSuccessMessage("Order status updated successfully!");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewOrderDetails = async (orderId: number) => {
    try {
      const order = await adminAPI.fetchOrderById(orderId);
      console.log("Order details:", order);
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login-page">
        {/* Left branding panel */}
        <div className="admin-login-left">
          <svg
            className="admin-login-geo"
            viewBox="0 0 400 600"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="0"
              x2="400"
              y2="600"
              stroke="#c8841a"
              strokeWidth="0.5"
              opacity="0.4"
            />
            <line
              x1="400"
              y1="0"
              x2="0"
              y2="600"
              stroke="#c8841a"
              strokeWidth="0.5"
              opacity="0.4"
            />
            <circle
              cx="200"
              cy="300"
              r="150"
              fill="none"
              stroke="#c8841a"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <circle
              cx="200"
              cy="300"
              r="220"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.3"
              opacity="0.2"
            />
          </svg>
          <div className="admin-login-left-content">
            <img
              src={transparentLogo}
              alt="KTM Bites"
              className="admin-login-logo"
            />
            <h2>Admin Panel</h2>
            <p>Manage your restaurant operations</p>
            <div className="admin-icon-feature">
              <span className="material-symbols-rounded ai-1">
                dashboard
              </span>
              <span className="material-symbols-rounded ai-2">
                restaurant_menu
              </span>
              <span className="material-symbols-rounded ai-3">
                analytics
              </span>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="admin-login-right">
          <div className="admin-login-card">
            <button className="admin-back-link" onClick={() => navigate("/")}>
              <span className="material-symbols-rounded">arrow_back</span>
              Back to Home
            </button>

            <img
              src={transparentLogo}
              alt="KTM Bites"
              className="admin-login-card-logo"
            />
            <h1>Admin Login</h1>
            <p className="admin-login-subtitle">Access the admin panel</p>

            <div className="admin-login-badge">
              <span className="material-symbols-rounded">admin_panel_settings</span>
              Admin Staff Only
            </div>

            {error && (
              <div className="admin-login-alert admin-login-alert-error">
                <span className="material-symbols-rounded">error</span>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="admin-login-alert admin-login-alert-success">
                <span className="material-symbols-rounded">check_circle</span>
                {successMessage}
              </div>
            )}

            <form className="admin-login-form" onSubmit={handleLogin}>
              <div className="admin-login-field">
                <label htmlFor="admin-email">Email</label>
                <div className="admin-login-input-wrapper">
                  <span className="material-symbols-rounded">mail</span>
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="admin@ktmbites.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-login-field">
                <label htmlFor="admin-password">Password</label>
                <div className="admin-login-input-wrapper">
                  <span className="material-symbols-rounded">lock</span>
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="admin-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-rounded">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="admin-login-btn"
                disabled={actionLoading}
              >
                <span className="material-symbols-rounded">login</span>
                {actionLoading ? "Signing In..." : "Enter Admin"}
              </button>
            </form>

            <div className="admin-demo-credentials">
              <p className="admin-demo-title">Admin Credentials:</p>
              <p className="admin-demo-text">
                Email: <strong>admin@ktmbites.com</strong>
              </p>
              <p className="admin-demo-text">
                Password: <strong>admin123</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <img
            src={transparentLogo}
            alt="KTM Bites"
            className="admin-header-logo"
          />
          <div className="admin-header-info">
            <h1 className="admin-header-title">KTM Bites Admin</h1>
            <p className="admin-header-subtitle">
              Restaurant Management System
            </p>
          </div>
        </div>
        <div className="admin-header-right">
          <span className="admin-user-email">
            {adminUser?.email || "admin@ktmbites.com"}
          </span>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span className="material-symbols-rounded">logout</span>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-wrapper">
        <div className="admin-sidebar">
          <nav className="admin-nav">
            <button
              className={`admin-nav-item ${currentSection === "dashboard" ? "active" : ""}`}
              onClick={() => setCurrentSection("dashboard")}
            >
              <span className="material-symbols-rounded">dashboard</span>
              <span>Dashboard</span>
            </button>
            <button
              className={`admin-nav-item ${currentSection === "menu" ? "active" : ""}`}
              onClick={() => setCurrentSection("menu")}
            >
              <span className="material-symbols-rounded">restaurant_menu</span>
              <span>Menu Items</span>
            </button>
            <button
              className={`admin-nav-item ${currentSection === "orders" ? "active" : ""}`}
              onClick={() => setCurrentSection("orders")}
            >
              <span className="material-symbols-rounded">shopping_cart</span>
              <span>Orders</span>
            </button>
            <button
              className={`admin-nav-item ${currentSection === "users" ? "active" : ""}`}
              onClick={() => setCurrentSection("users")}
            >
              <span className="material-symbols-rounded">people</span>
              <span>Users</span>
            </button>
          </nav>
        </div>

        <div className="admin-content">
          {error && (
            <div className="admin-alert admin-alert-error">
              <span className="material-symbols-rounded">error</span>
              <div>{error}</div>
              <button
                onClick={() => setError("")}
                className="admin-alert-close"
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div className="admin-alert admin-alert-success">
              <span className="material-symbols-rounded">check_circle</span>
              <div>{successMessage}</div>
              <button
                onClick={() => setSuccessMessage("")}
                className="admin-alert-close"
              >
                ✕
              </button>
            </div>
          )}

          {currentSection === "dashboard" && (
            <div className="admin-section">
              <h2 className="admin-section-title">Dashboard Overview</h2>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <span className="material-symbols-rounded">restaurant</span>
                  </div>
                  <div className="admin-stat-label">Menu Items</div>
                  <div className="admin-stat-value">{menuItems.length}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <span className="material-symbols-rounded">
                      shopping_cart
                    </span>
                  </div>
                  <div className="admin-stat-label">Total Orders</div>
                  <div className="admin-stat-value">{orders.length}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <span className="material-symbols-rounded">people</span>
                  </div>
                  <div className="admin-stat-label">Total Users</div>
                  <div className="admin-stat-value">{users.length}</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <span className="material-symbols-rounded">
                      trending_up
                    </span>
                  </div>
                  <div className="admin-stat-label">System Status</div>
                  <div className="admin-stat-value-status">Active</div>
                </div>
              </div>
            </div>
          )}

          {currentSection === "menu" && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">Menu Items Management</h2>
                <button
                  className="admin-btn-primary"
                  onClick={handleAddMenuItem}
                  disabled={actionLoading}
                >
                  <span className="material-symbols-rounded">add</span>
                  Add New Item
                </button>
              </div>

              {showMenuModal && (
                <div className="admin-modal-overlay">
                  <div className="admin-modal">
                    <div className="admin-modal-header">
                      <h3>
                        {editingMenuItem
                          ? "Edit Menu Item"
                          : "Add New Menu Item"}
                      </h3>
                      <button
                        className="admin-modal-close"
                        onClick={() => setShowMenuModal(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="admin-modal-body">
                      <div className="admin-form-group">
                        <label>Item Name *</label>
                        <input
                          type="text"
                          value={menuForm.name}
                          onChange={(e) =>
                            setMenuForm({ ...menuForm, name: e.target.value })
                          }
                          placeholder="Enter item name"
                          required
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Category *</label>
                        <select
                          value={menuForm.category}
                          onChange={(e) =>
                            setMenuForm({
                              ...menuForm,
                              category: parseInt(e.target.value),
                            })
                          }
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="admin-form-group">
                        <label>Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={menuForm.price}
                          onChange={(e) =>
                            setMenuForm({
                              ...menuForm,
                              price: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Enter price"
                          required
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Image URL *</label>
                        <input
                          type="url"
                          value={menuForm.image}
                          onChange={(e) =>
                            setMenuForm({ ...menuForm, image: e.target.value })
                          }
                          placeholder="Enter image URL"
                          required
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Description</label>
                        <textarea
                          value={menuForm.description}
                          onChange={(e) =>
                            setMenuForm({
                              ...menuForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Enter description"
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="admin-modal-footer">
                      <button
                        className="admin-btn-secondary"
                        onClick={() => setShowMenuModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="admin-btn-primary"
                        onClick={handleSaveMenuItem}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Saving..." : "Save Item"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="admin-table-card">
                {loading ? (
                  <LoadingAnimation message="Loading menu items..." />
                ) : menuItems.length === 0 ? (
                  <div className="admin-empty-state">
                    <span className="material-symbols-rounded">restaurant</span>
                    <p>No menu items found. Start by adding one!</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item.id}>
                          <td className="admin-table-name">
                            <strong>{item.name}</strong>
                          </td>
                          <td>{item.category}</td>
                          <td className="admin-table-price">
                            Rs. {item.price}
                          </td>
                          <td>
                            <span
                              className={`admin-badge ${item.is_available ? "available" : "unavailable"}`}
                            >
                              {item.is_available ? "Available" : "Unavailable"}
                            </span>
                          </td>
                          <td className="admin-actions">
                            <button
                              className="admin-btn-icon admin-btn-edit"
                              onClick={() => handleEditMenuItem(item)}
                              title="Edit item"
                            >
                              <span className="material-symbols-rounded">
                                edit
                              </span>
                            </button>
                            <button
                              className="admin-btn-icon admin-btn-delete"
                              onClick={() => handleDeleteMenuItem(item.id!)}
                              title="Delete item"
                            >
                              <span className="material-symbols-rounded">
                                delete
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {currentSection === "orders" && (
            <div className="admin-section">
              <h2 className="admin-section-title">Orders Management</h2>
              <div className="admin-table-card">
                {loading ? (
                  <LoadingAnimation message="Loading orders..." />
                ) : orders.length === 0 ? (
                  <div className="admin-empty-state">
                    <span className="material-symbols-rounded">
                      shopping_cart
                    </span>
                    <p>No orders found</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="admin-table-order-id">
                            <strong>{order.order_id}</strong>
                          </td>
                          <td>{order.full_name}</td>
                          <td className="admin-table-price">
                            Rs. {order.total}
                          </td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  e.target.value,
                                )
                              }
                              className={`admin-status-select admin-status-${order.status}`}
                              disabled={actionLoading}
                            >
                              <option value="placed">Order Placed</option>
                              <option value="preparing">Preparing</option>
                              <option value="on_way">On the Way</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>{order.payment_method}</td>
                          <td>
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className="admin-btn-icon admin-btn-view"
                              onClick={() => handleViewOrderDetails(order.id)}
                              title="View order details"
                            >
                              <span className="material-symbols-rounded">
                                visibility
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {currentSection === "users" && (
            <div className="admin-section">
              <h2 className="admin-section-title">Users Management</h2>
              <div className="admin-table-card">
                {loading ? (
                  <LoadingAnimation message="Loading users..." />
                ) : users.length === 0 ? (
                  <div className="admin-empty-state">
                    <span className="material-symbols-rounded">people</span>
                    <p>No users found</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Full Name</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>#{user.id}</td>
                          <td className="admin-table-email">{user.email}</td>
                          <td>{user.full_name}</td>
                          <td>{user.phone || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
