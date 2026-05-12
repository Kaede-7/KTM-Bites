# ============================================================
# urls.py — All API Routes
# ============================================================
# This file maps URL paths to view functions in views.py.
# Every URL starts with /api/ (configured in ktmbites/urls.py).
#
# Example: path('menu/', views.menu_list) means:
#   When someone visits /api/menu/, run the menu_list() function
#
# <int:pk> means "capture a number from the URL". For example:
#   /api/orders/5/ → pk=5 → fetch order with ID 5
# ============================================================

from django.urls import path
from . import views

urlpatterns = [
    # ── Authentication ────────────────────────────────────────
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/profile/', views.profile_view, name='profile'),
    path('auth/change-password/', views.change_password_view, name='change-password'),
    path('auth/google/', views.google_login_view, name='google-login'),
    path('auth/forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
    path('rider/register/', views.rider_register_view, name='rider-register'),
    path('rider/login/', views.rider_login_view, name='rider-login'),

    # ── Menu (public — no login needed) ───────────────────────
    path('categories/', views.category_list, name='category-list'),
    path('menu/', views.menu_list, name='menu-list'),
    path('menu/<int:pk>/', views.menu_detail, name='menu-detail'),

    # ── Shopping Cart ─────────────────────────────────────────
    path('cart/', views.cart_view, name='cart'),
    path('cart/add/', views.cart_add, name='cart-add'),
    path('cart/update/<int:pk>/', views.cart_update, name='cart-update'),
    path('cart/remove/<int:pk>/', views.cart_remove, name='cart-remove'),

    # ── Orders ────────────────────────────────────────────────
    path('orders/', views.order_list_create, name='order-list-create'),
    path('orders/<int:pk>/', views.order_detail, name='order-detail'),
    path('orders/<int:pk>/cancel/', views.cancel_order, name='order-cancel'),

    # ── Admin Panel (staff only) ──────────────────────────────
    path('admin/orders/', views.admin_orders_list, name='admin-orders-list'),
    path('admin/orders/<int:pk>/', views.admin_order_detail, name='admin-order-detail'),
    path('admin/users/', views.admin_users_list, name='admin-users-list'),
    path('admin/menu/', views.admin_menu_items, name='admin-menu-items'),
    path('admin/categories/', views.admin_categories, name='admin-categories'),

    # ── Payments (Khalti gateway) ─────────────────────────────
    path('payments/initiate/', views.initiate_payment, name='initiate-payment'),
    path('payments/verify/', views.verify_payment, name='verify-payment'),
    path('payments/status/<int:order_id>/', views.payment_status_view, name='payment-status'),

    # ── AI Features ───────────────────────────────────────────
    path('ai/chat/', views.chat_view, name='ai-chat'),
    path('ai/recommendations/', views.recommendations_view, name='ai-recommendations'),

    # ── Rider GPS Tracking ────────────────────────────────────
    path('rider/location/', views.update_rider_location, name='rider-location'),
    path('rider/profile/', views.rider_profile_view, name='rider-profile'),
]
