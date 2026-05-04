from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/profile/', views.profile_view, name='profile'),
    path('auth/change-password/', views.change_password_view, name='change-password'),

    # Menu
    path('categories/', views.category_list, name='category-list'),
    path('menu/', views.menu_list, name='menu-list'),
    path('menu/<int:pk>/', views.menu_detail, name='menu-detail'),

    # Cart
    path('cart/', views.cart_view, name='cart'),
    path('cart/add/', views.cart_add, name='cart-add'),
    path('cart/update/<int:pk>/', views.cart_update, name='cart-update'),
    path('cart/remove/<int:pk>/', views.cart_remove, name='cart-remove'),

    # Orders
    path('orders/', views.order_list_create, name='order-list-create'),
    path('orders/<int:pk>/', views.order_detail, name='order-detail'),

    # Admin
    path('admin/orders/', views.admin_orders_list, name='admin-orders-list'),
    path('admin/orders/<int:pk>/', views.admin_order_detail, name='admin-order-detail'),
    path('admin/users/', views.admin_users_list, name='admin-users-list'),
    path('admin/menu/', views.admin_menu_items, name='admin-menu-items'),
    path('admin/categories/', views.admin_categories, name='admin-categories'),

    # Payments (Khalti)
    path('payments/initiate/', views.initiate_payment, name='initiate-payment'),
    path('payments/verify/', views.verify_payment, name='verify-payment'),
    path('payments/status/<int:order_id>/', views.payment_status_view, name='payment-status'),
]
