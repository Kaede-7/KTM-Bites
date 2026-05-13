import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../css/admin.css";
import "../css/auth.css";
import transparentLogo from "../assets/logo-ktmbites-transparent.png";
import * as adminAPI from "../api/admin";
import * as authAPI from "../api/auth";
import { geocodeAddress, KATHMANDU_CENTER } from "../api/geocode";
import API from "../api/axios";
import LoadingAnimation from "../components/LoadingAnimation";
import AuthCreative from "../components/AuthCreative";
import { useToast } from "../components/Toast";


interface MenuItem {
  id?: number;
  name: string;
  category?: string | number;
  category_name?: string;
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
  payment_status?: string;
  transaction_id?: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  total: number;
  items?: any[];
  created_at: string;
  rider?: number;
  rider_location?: { lat: number, lng: number };
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

interface Rider {
  id?: number;
  full_name: string;
  email: string;
  username: string;
  phone: string;
  vehicle_type?: string;
  license_number?: string;
  is_available?: boolean;
  password?: string;
}

const Admin: React.FC = () => {
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
  });

  // Riders State
  const [riders, setRiders] = useState<Rider[]>([]);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [riderForm, setRiderForm] = useState<Rider>({
    full_name: "",
    email: "",
    username: "",
    phone: "",
    vehicle_type: "",
    license_number: "",
    is_available: true,
    password: "",
  });

  // Loading States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [simulatingOrderId, setSimulatingOrderId] = useState<number | null>(null);
  const simulationIntervalRef = useRef<any>(null);

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
      } else if (currentSection === "riders") {
        const riderData = await adminAPI.fetchAllRiders();
        setRiders(riderData);
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
      const response = await authAPI.login(email, password, rememberMe);

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
    authAPI.logout(null); // Also clear the backend auth, but don't redirect away from /admin
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
      if (editingMenuItem && editingMenuItem.id !== undefined) {
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
      alert(`Order Details: ${order.order_id}\nCustomer: ${order.full_name}\nTotal: Rs. ${order.total}\nStatus: ${order.status_display}`);
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      email: "",
      full_name: "",
      phone: "",
      password: "",
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || "",
      password: "", // Don't populate password on edit
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      setActionLoading(true);
      if (editingUser && editingUser.id !== undefined) {
        // Prevent sending empty password if it hasn't changed
        const updateData: any = { ...userForm };
        if (!updateData.password) {
          delete updateData.password;
        }
        await adminAPI.updateUser(editingUser.id, updateData);
        setSuccessMessage("User updated successfully!");
      } else {
        await adminAPI.createUser(userForm);
        setSuccessMessage("User created successfully!");
      }
      setShowUserModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      setActionLoading(true);
      await adminAPI.deleteUser(id);
      setSuccessMessage("User deleted successfully!");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRider = () => {
    setEditingRider(null);
    setRiderForm({
      full_name: "",
      email: "",
      username: "",
      phone: "",
      vehicle_type: "",
      license_number: "",
      is_available: true,
      password: "",
    });
    setShowRiderModal(true);
  };

  const handleEditRider = (rider: Rider) => {
    setEditingRider(rider);
    setRiderForm({
      ...rider,
      password: "", // Don't populate password on edit
    });
    setShowRiderModal(true);
  };

  const handleSaveRider = async () => {
    try {
      setActionLoading(true);
      if (editingRider && editingRider.id !== undefined) {
        const updateData: any = { ...riderForm };
        if (!updateData.password) {
          delete updateData.password;
        }
        await adminAPI.updateRider(editingRider.id, updateData);
        setSuccessMessage("Rider updated successfully!");
      } else {
        await adminAPI.createRider(riderForm);
        setSuccessMessage("Rider created successfully!");
      }
      setShowRiderModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save rider");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRider = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this rider? This cannot be undone.")) return;
    try {
      setActionLoading(true);
      await adminAPI.deleteRider(id);
      setSuccessMessage("Rider deleted successfully!");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete rider");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Simulation Logic ──────────────────────────────────────────

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setSimulatingOrderId(null);
    showToast("Simulation stopped.", "info");
  };

  const handleSimulateDelivery = async (order: Order) => {
    if (simulatingOrderId) {
      stopSimulation();
      return;
    }

    if (!order.rider) {
      showToast("No rider assigned to this order.", "error");
      return;
    }

    setSimulatingOrderId(order.id);
    showToast("Starting road-follower simulation...", "success");

    try {
      // 1. Get destination coordinates
      const targetPos = await geocodeAddress(order.address, order.city);
      
      // 2. Get current rider coordinates (fallback to Kathmandu if null)
      const currentPos = order.rider_location || KATHMANDU_CENTER;

      // 3. Fetch OSRM route
      const url = `https://router.project-osrm.org/route/v1/driving/${currentPos.lng},${currentPos.lat};${targetPos.lng},${targetPos.lat}?geometries=geojson&overview=full`;
      const routeRes = await fetch(url);
      const routeData = await routeRes.json();

      if (routeData.code !== 'Ok' || !routeData.routes.length) {
        throw new Error("Could not find a road route for simulation.");
      }

      // OSRM returns [lng, lat]
      let coords: [number, number][] = routeData.routes[0].geometry.coordinates;

      // Filter out duplicate consecutive points
      coords = coords.filter((c, i) => i === 0 || c[0] !== coords[i-1][0] || c[1] !== coords[i-1][1]);

      if (coords.length < 2) {
        coords = [[currentPos.lng, currentPos.lat], [targetPos.lng, targetPos.lat]];
      }

      const totalSteps = coords.length;
      // Faster updates (1s) and more steps (up to 40)
      const stepJump = Math.max(1, Math.floor(totalSteps / 35)); 
      let currentStep = 0;

      simulationIntervalRef.current = setInterval(async () => {
        const isLastStep = currentStep >= totalSteps;
        const safeIdx = isLastStep ? totalSteps - 1 : currentStep;
        const [lng, lat] = coords[safeIdx];
        
        // Update rider location in DB
        try {
          await API.put('/rider/location/', { lat, lng }, {
            headers: { 'Authorization': `RIDER_TOKEN_${order.rider}` }
          });
          
          if (isLastStep) {
            setTimeout(() => {
              stopSimulation();
              handleUpdateOrderStatus(order.id, "delivered");
              showToast("Simulation complete: Order delivered!", "success");
            }, 1000);
            
            if (simulationIntervalRef.current) {
              clearInterval(simulationIntervalRef.current);
              simulationIntervalRef.current = null;
            }
            return;
          }

          currentStep += stepJump;
        } catch (err) {
          console.error("Simulation step failed:", err);
          stopSimulation();
        }
      }, 1000);

    } catch (err: any) {
      showToast(err.message || "Simulation failed to start.", "error");
      setSimulatingOrderId(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        {/* Left Panel - Dynamic Form (Login/Signup) */}
        <div className="auth-left">
          <Link to="/" className="auth-back-btn">
            <span className="material-symbols-rounded">arrow_back</span>
            Back to Home
          </Link>
          <div className="auth-form-container auth-fade-in">
            <h1>Admin Login</h1>
            <p className="auth-subtitle">Access the admin panel.</p>

            <div className="auth-promise-badge">
              <span className="material-symbols-rounded">admin_panel_settings</span>
              Admin Staff Only
            </div>

            {error && (
              <div className="auth-error">
                <span className="material-symbols-rounded">error</span>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="auth-success-msg">
                <span className="material-symbols-rounded">check_circle</span>
                {successMessage}
              </div>
            )}

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">mail</span>
                <input
                  type="email"
                  placeholder="admin@ktmbites.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-wrapper">
                <span className="material-symbols-rounded">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-rounded">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>

              <div className="auth-options-row">
                <label className="auth-remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={actionLoading}>
                {actionLoading ? "Signing In..." : "Enter Admin"}
              </button>

              <div className="auth-footer" style={{ marginTop: '2rem' }}>
                <Link to="/">Back to Home</Link>
              </div>
            </form>
            
            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <p>Demo Credentials:</p>
              <p>admin@ktmbites.com / admin123</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Persistent Static Creative */}
        <div className="auth-right">
          <AuthCreative />
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
            <h1 className="admin-header-title">KTM Bites</h1>
            <p className="admin-header-subtitle">
              Administration Portal
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
            <button
              className={`admin-nav-item ${currentSection === "riders" ? "active" : ""}`}
              onClick={() => setCurrentSection("riders")}
            >
              <span className="material-symbols-rounded">delivery_dining</span>
              <span>Riders</span>
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
                    <span className="material-symbols-rounded">delivery_dining</span>
                  </div>
                  <div className="admin-stat-label">Active Riders</div>
                  <div className="admin-stat-value">{riders.filter(r => r.is_available).length} / {riders.length}</div>
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
                            <option key={cat.id || cat.name} value={cat.id}>
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
                          <td>{item.category_name || item.category}</td>
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
                              <option value="ready_for_pickup">Ready for Pickup</option>
                              <option value="on_way">On the Way</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                {order.payment_method}
                                {order.payment_method === 'khalti' && order.payment_status && (
                                  <span style={{ 
                                    marginLeft: '6px', 
                                    fontSize: '11px', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    backgroundColor: order.payment_status === 'completed' ? '#e8f5e9' : '#ffebee',
                                    color: order.payment_status === 'completed' ? '#2e7d32' : '#c62828'
                                  }}>
                                    {order.payment_status}
                                  </span>
                                )}
                              </span>
                              {order.transaction_id && (
                                <span style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                                  TXN: {order.transaction_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="admin-btn-icon admin-btn-view"
                                onClick={() => handleViewOrderDetails(order.id)}
                                title="View order details"
                              >
                                <span className="material-symbols-rounded">visibility</span>
                              </button>
                              
                              {order.status === 'on_way' && (
                                <button
                                  className={`admin-btn-icon ${simulatingOrderId === order.id ? 'admin-btn-sim-active' : 'admin-btn-sim'}`}
                                  onClick={() => handleSimulateDelivery(order)}
                                  title={simulatingOrderId === order.id ? "Stop Simulation" : "Simulate Delivery"}
                                >
                                  <span className="material-symbols-rounded">
                                    {simulatingOrderId === order.id ? "stop_circle" : "route"}
                                  </span>
                                </button>
                              )}
                            </div>
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
              <div className="admin-section-header">
                <h2 className="admin-section-title">Users Management</h2>
                <button
                  className="admin-btn-primary"
                  onClick={handleAddUser}
                  disabled={actionLoading}
                >
                  <span className="material-symbols-rounded">add</span>
                  Add New User
                </button>
              </div>

              {showUserModal && (
                <div className="admin-modal-overlay">
                  <div className="admin-modal">
                    <div className="admin-modal-header">
                      <h3>
                        {editingUser ? "Edit User" : "Add New User"}
                      </h3>
                      <button
                        className="admin-modal-close"
                        onClick={() => setShowUserModal(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="admin-modal-body">
                      <div className="admin-form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) =>
                            setUserForm({ ...userForm, email: e.target.value })
                          }
                          placeholder="Enter user email"
                          required
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={userForm.full_name}
                          onChange={(e) =>
                            setUserForm({ ...userForm, full_name: e.target.value })
                          }
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Phone</label>
                        <input
                          type="text"
                          value={userForm.phone}
                          onChange={(e) =>
                            setUserForm({ ...userForm, phone: e.target.value })
                          }
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Password {editingUser ? "(leave blank to keep current)" : "*"}</label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) =>
                            setUserForm({ ...userForm, password: e.target.value })
                          }
                          placeholder={editingUser ? "Enter new password if changing" : "Enter new password"}
                          required={!editingUser}
                        />
                      </div>
                    </div>
                    <div className="admin-modal-footer">
                      <button
                        className="admin-btn-secondary"
                        onClick={() => setShowUserModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="admin-btn-primary"
                        onClick={handleSaveUser}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Saving..." : "Save User"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>#{user.id}</td>
                          <td className="admin-table-email">{user.email}</td>
                          <td>{user.full_name}</td>
                          <td>{user.phone || "N/A"}</td>
                          <td className="admin-actions">
                            <button
                              className="admin-btn-icon admin-btn-edit"
                              onClick={() => handleEditUser(user)}
                              title="Edit user"
                            >
                              <span className="material-symbols-rounded">
                                edit
                              </span>
                            </button>
                            <button
                              className="admin-btn-icon admin-btn-delete"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete user"
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

          {currentSection === "riders" && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">Riders Management</h2>
                <button
                  className="admin-btn-primary"
                  onClick={handleAddRider}
                  disabled={actionLoading}
                >
                  <span className="material-symbols-rounded">add</span>
                  Add New Rider
                </button>
              </div>

              {showRiderModal && (
                <div className="admin-modal-overlay">
                  <div className="admin-modal">
                    <div className="admin-modal-header">
                      <h3>{editingRider ? "Edit Rider" : "Add New Rider"}</h3>
                      <button
                        className="admin-modal-close"
                        onClick={() => setShowRiderModal(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="admin-modal-body">
                      <div className="admin-form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={riderForm.full_name}
                          onChange={(e) =>
                            setRiderForm({
                              ...riderForm,
                              full_name: e.target.value,
                            })
                          }
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={riderForm.email}
                          onChange={(e) =>
                            setRiderForm({
                              ...riderForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="Enter email"
                          required
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Phone *</label>
                        <input
                          type="text"
                          value={riderForm.phone}
                          onChange={(e) =>
                            setRiderForm({
                              ...riderForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Vehicle Type</label>
                        <input
                          type="text"
                          value={riderForm.vehicle_type}
                          onChange={(e) =>
                            setRiderForm({
                              ...riderForm,
                              vehicle_type: e.target.value,
                            })
                          }
                          placeholder="e.g. Scooter, Bike"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>License Number</label>
                        <input
                          type="text"
                          value={riderForm.license_number}
                          onChange={(e) =>
                            setRiderForm({
                              ...riderForm,
                              license_number: e.target.value,
                            })
                          }
                          placeholder="Enter license number"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>
                          Password{" "}
                          {editingRider ? "(leave blank to keep current)" : "*"}
                        </label>
                        <input
                          type="password"
                          value={riderForm.password}
                          onChange={(e) =>
                            setRiderForm({
                              ...riderForm,
                              password: e.target.value,
                            })
                          }
                          placeholder={
                            editingRider
                              ? "Enter new password if changing"
                              : "Enter password"
                          }
                          required={!editingRider}
                        />
                      </div>
                      <div className="admin-form-group-checkbox">
                        <input
                          type="checkbox"
                          id="is_available"
                          checked={riderForm.is_available}
                          onChange={(e) =>
                            setRiderForm({
                              ...riderForm,
                              is_available: e.target.checked,
                            })
                          }
                        />
                        <label htmlFor="is_available">
                          Available for Delivery
                        </label>
                      </div>
                    </div>
                    <div className="admin-modal-footer">
                      <button
                        className="admin-btn-secondary"
                        onClick={() => setShowRiderModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="admin-btn-primary"
                        onClick={handleSaveRider}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Saving..." : "Save Rider"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="admin-table-card">
                {loading ? (
                  <LoadingAnimation message="Loading riders..." />
                ) : riders.length === 0 ? (
                  <div className="admin-empty-state">
                    <span className="material-symbols-rounded">
                      delivery_dining
                    </span>
                    <p>No riders found</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email / Phone</th>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riders.map((rider) => (
                        <tr key={rider.id}>
                          <td>
                            <strong>{rider.full_name}</strong>
                          </td>
                          <td>
                            <div
                              style={{ display: "flex", flexDirection: "column" }}
                            >
                              <span>{rider.email}</span>
                              <span style={{ fontSize: "12px", color: "#666" }}>
                                {rider.phone}
                              </span>
                            </div>
                          </td>
                          <td>{rider.vehicle_type || "N/A"}</td>
                          <td>
                            <span
                              className={`admin-badge ${rider.is_available ? "available" : "unavailable"}`}
                            >
                              {rider.is_available ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td className="admin-actions">
                            <button
                              className="admin-btn-icon admin-btn-edit"
                              onClick={() => handleEditRider(rider)}
                              title="Edit rider"
                            >
                              <span className="material-symbols-rounded">
                                edit
                              </span>
                            </button>
                            <button
                              className="admin-btn-icon admin-btn-delete"
                              onClick={() => handleDeleteRider(rider.id!)}
                              title="Delete rider"
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
        </div>
      </div>
    </div>
  );
};

export default Admin;
