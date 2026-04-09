from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.models import User

from .models import Category, MenuItem, Cart, CartItem, Order, OrderItem, UserProfile
from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    CategorySerializer, MenuItemSerializer, MenuItemDetailSerializer,
    CartSerializer, AddToCartSerializer, UpdateCartItemSerializer,
    OrderSerializer, PlaceOrderSerializer,
)


# Custom permission for admin-only access
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


# ═══════════════════════════════════════════
# AUTH VIEWS
# ═══════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        # Create an empty cart for the user
        Cart.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.first_name,
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
        )
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            Cart.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.first_name,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                }
            })
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)

    if request.method == 'GET':
        return Response({
            'id': user.id,
            'email': user.email,
            'full_name': user.first_name,
            'phone': user.last_name,
            'address': profile.address,
            'city': profile.city,
            'bio': profile.bio,
        })
    elif request.method == 'PUT':
        user.first_name = request.data.get('full_name', user.first_name)
        user.last_name = request.data.get('phone', user.last_name)
        if 'email' in request.data:
            user.email = request.data['email']
            user.username = request.data['email']
        user.save()

        profile.address = request.data.get('address', profile.address)
        profile.city = request.data.get('city', profile.city)
        profile.bio = request.data.get('bio', profile.bio)
        profile.save()

        return Response({
            'id': user.id,
            'email': user.email,
            'full_name': user.first_name,
            'phone': user.last_name,
            'address': profile.address,
            'city': profile.city,
            'bio': profile.bio,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    user = request.user
    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')

    if not current_password or not new_password:
        return Response({'error': 'Both current and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 6:
        return Response({'error': 'New password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    # Update the auth token so the user stays logged in
    Token.objects.filter(user=user).delete()
    new_token = Token.objects.create(user=user)

    return Response({
        'message': 'Password changed successfully',
        'token': new_token.key,
    })


# ═══════════════════════════════════════════
# MENU VIEWS
# ═══════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def menu_list(request):
    items = MenuItem.objects.filter(is_available=True)

    # Filter by category
    category = request.query_params.get('category')
    if category and category != 'All':
        items = items.filter(category__name__iexact=category)

    # Search
    search = request.query_params.get('search')
    if search:
        items = items.filter(name__icontains=search)

    # Sort
    sort = request.query_params.get('sort', 'popular')
    if sort == 'price-low':
        items = items.order_by('price')
    elif sort == 'price-high':
        items = items.order_by('-price')
    elif sort == 'rating':
        items = items.order_by('-rating')

    serializer = MenuItemSerializer(items, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def menu_detail(request, pk):
    try:
        item = MenuItem.objects.get(pk=pk, is_available=True)
    except MenuItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = MenuItemDetailSerializer(item)
    return Response(serializer.data)


# ═══════════════════════════════════════════
# CART VIEWS
# ═══════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_view(request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_add(request):
    serializer = AddToCartSerializer(data=request.data)
    if serializer.is_valid():
        cart, _ = Cart.objects.get_or_create(user=request.user)
        try:
            menu_item = MenuItem.objects.get(pk=serializer.validated_data['menu_item_id'])
        except MenuItem.DoesNotExist:
            return Response({'error': 'Menu item not found'}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, menu_item=menu_item,
            defaults={'quantity': serializer.validated_data['quantity']}
        )
        if not created:
            cart_item.quantity += serializer.validated_data['quantity']
            cart_item.save()

        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def cart_update(request, pk):
    serializer = UpdateCartItemSerializer(data=request.data)
    if serializer.is_valid():
        try:
            cart_item = CartItem.objects.get(pk=pk, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

        cart_item.quantity = serializer.validated_data['quantity']
        cart_item.save()

        cart = cart_item.cart
        return Response(CartSerializer(cart).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cart_remove(request, pk):
    try:
        cart_item = CartItem.objects.get(pk=pk, cart__user=request.user)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    cart = cart_item.cart
    cart_item.delete()
    return Response(CartSerializer(cart).data)


# ═══════════════════════════════════════════
# ORDER VIEWS
# ═══════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order_list_create(request):
    if request.method == 'GET':
        orders = Order.objects.filter(user=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = PlaceOrderSerializer(data=request.data)
        if serializer.is_valid():
            cart, _ = Cart.objects.get_or_create(user=request.user)
            cart_items = cart.items.all()

            if not cart_items.exists():
                return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

            subtotal = sum(item.subtotal for item in cart_items)
            delivery_fee = 80
            total = subtotal + delivery_fee

            order = Order.objects.create(
                user=request.user,
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total=total,
                **serializer.validated_data,
            )

            for cart_item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    menu_item=cart_item.menu_item,
                    quantity=cart_item.quantity,
                    price=cart_item.menu_item.price,
                )

            # Clear cart after placing order
            cart_items.delete()

            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = OrderSerializer(order)
    return Response(serializer.data)


# ═══════════════════════════════════════════
# ADMIN VIEWS
# ═══════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_orders_list(request):
    """Get all orders (admin only)"""
    orders = Order.objects.all().order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAdmin])
def admin_order_detail(request, pk):
    """Get order detail or update status (admin only)"""
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        if 'status' in request.data:
            new_status = request.data['status']
            if new_status in dict(Order.STATUS_CHOICES):
                order.status = new_status
                order.save()
                serializer = OrderSerializer(order)
                return Response(serializer.data)
            else:
                return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'No status provided'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_users_list(request):
    """Get all users (admin only)"""
    from .serializers import ProfileSerializer
    users = User.objects.all().order_by('-date_joined')
    data = []
    for user in users:
        data.append({
            'id': user.id,
            'email': user.email,
            'full_name': user.first_name,
            'phone': user.last_name,
        })
    return Response(data)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def admin_menu_items(request):
    """Admin menu items CRUD"""
    if request.method == 'GET':
        items = MenuItem.objects.all()
        serializer = MenuItemSerializer(items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = MenuItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PUT':
        item_id = request.data.get('id')
        try:
            item = MenuItem.objects.get(pk=item_id)
        except MenuItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MenuItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        item_id = request.data.get('id')
        try:
            item = MenuItem.objects.get(pk=item_id)
            item.delete()
            return Response({'message': 'Item deleted'}, status=status.HTTP_200_OK)
        except MenuItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def admin_categories(request):
    """Admin categories CRUD"""
    if request.method == 'GET':
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PUT':
        category_id = request.data.get('id')
        try:
            category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        category_id = request.data.get('id')
        try:
            category = Category.objects.get(pk=category_id)
            category.delete()
            return Response({'message': 'Category deleted'}, status=status.HTTP_200_OK)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
