from django.contrib import admin
from .models import (
    Category, MenuItem, Cart, CartItem, Order, OrderItem, 
    UserProfile, AdminProfile, KitchenProfile, RiderProfile
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'rating', 'badge', 'is_available']
    list_filter = ['category', 'is_available']
    search_fields = ['name']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'item_count', 'total', 'updated_at']


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'menu_item', 'quantity', 'subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'user', 'status', 'payment_method', 'total', 'created_at']
    list_filter = ['status', 'payment_method']
    search_fields = ['user__username', 'full_name']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'menu_item', 'quantity', 'price']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'city', 'address']
    list_filter = ['role', 'city']
    search_fields = ['user__username', 'user__email']


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'employee_id', 'department']


@admin.register(KitchenProfile)
class KitchenProfileAdmin(admin.ModelAdmin):
    list_display = ['restaurant_name', 'user', 'is_open']
    list_filter = ['is_open']


@admin.register(RiderProfile)
class RiderProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'vehicle_type', 'is_available']
    list_filter = ['is_available', 'vehicle_type']

