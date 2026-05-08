import requests
import secrets
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os

from .models import (
    Category, MenuItem, Cart, CartItem,
    Order, OrderItem, UserProfile, PasswordResetToken
)

from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    CategorySerializer, MenuItemSerializer, MenuItemDetailSerializer,
    CartSerializer, AddToCartSerializer, UpdateCartItemSerializer,
    OrderSerializer, PlaceOrderSerializer,
)

# ========================
# ADMIN PERMISSION
# ========================
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.is_superuser
        )


# ========================
# THROTTLING
# ========================
class ForgotPasswordThrottle(UserRateThrottle):
    """Rate limit for forgot password endpoint: 5 requests per minute."""
    scope = 'forgot_password'


# ========================
# EMAIL UTILITIES
# ========================
def send_password_reset_email(user, token):
    """
    Send password reset email to user.
    Email includes reset link with 15-minute expiry notice.
    """
    reset_url = f"http://localhost:3000/reset-password?token={token}"
    subject = "Password Reset Request - KTM Bites"
    message = f"""
Hello {user.first_name or user.email},

We received a request to reset your password for your KTM Bites account.

To reset your password, click the link below:
{reset_url}

This link will expire in 15 minutes.

If you did not request a password reset, please ignore this email or contact our support team.

Best regards,
KTM Bites Team
support@ktmbites.com
    """.strip()

    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                <h2 style="color: #d32f2f;">Password Reset Request</h2>
                <p>Hello {user.first_name or user.email},</p>
                <p>We received a request to reset your password for your KTM Bites account.</p>
                <p style="margin: 30px 0;">
                    <a href="{reset_url}" style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </p>
                <p style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
                    <strong>⏱️ This link expires in 15 minutes.</strong>
                </p>
                <p>If you did not request a password reset, please ignore this email or <a href="mailto:support@ktmbites.com">contact support</a>.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    KTM Bites Team<br>
                    <a href="mailto:support@ktmbites.com">support@ktmbites.com</a>
                </p>
            </div>
        </body>
    </html>
    """.strip()

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        # Log the error but do not raise (fail gracefully)
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        return False


# ========================
# AUTH
# ========================
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        Cart.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.first_name,
            }
        }, status=201)

    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = authenticate(
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )

        if user:
            token, _ = Token.objects.get_or_create(user=user)
            Cart.objects.get_or_create(user=user)

            return Response({
                "token": token.key,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.first_name,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                }
            })

        return Response({"error": "Invalid credentials"}, status=401)

    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_view(request):
    credential = request.data.get('credential')
    access_token = request.data.get('access_token')

    if not credential and not access_token:
        return Response({'error': 'No credential provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if credential:
            # Verify the ID token
            idinfo = id_token.verify_oauth2_token(credential, google_requests.Request())
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
        else:
            # Verify via access token
            res = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers={'Authorization': f'Bearer {access_token}'})
            idinfo = res.json()
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
        
        if not email:
            return Response({'error': 'Google token did not contain an email'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get or create user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=User.objects.make_random_password()
            )
            Cart.objects.get_or_create(user=user)
            
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
        
    except ValueError as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


# ========================
# PROFILE
# ========================
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)

    if request.method == 'GET':
        return Response({
            "id": user.id,
            "email": user.email,
            "full_name": user.first_name,
            "phone": user.last_name,
            "address": profile.address,
            "city": profile.city,
            "bio": profile.bio,
        })

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

    return Response({"message": "Profile updated"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    user = request.user
    current = request.data.get("current_password")
    new = request.data.get("new_password")

    if not user.check_password(current):
        return Response({"error": "Wrong password"}, status=400)

    user.set_password(new)
    user.save()

    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)

    return Response({"message": "Password changed", "token": token.key})


# ========================
# PASSWORD RESET
# ========================
class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Accepts email and sends password reset link.
    Returns generic success message to prevent user enumeration.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ForgotPasswordThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # Try to find user by email, but do not reveal if found or not
            try:
                user = User.objects.get(email=email)
                
                # Generate secure token
                token = secrets.token_urlsafe(32)
                
                # Calculate expiry: 15 minutes from now
                expires_at = timezone.now() + timezone.timedelta(minutes=15)
                
                # Save token to database
                PasswordResetToken.objects.create(
                    user=user,
                    token=token,
                    expires_at=expires_at
                )
                
                # Send email
                send_password_reset_email(user, token)
                
            except User.DoesNotExist:
                # User not found, but we still return generic success message
                pass
            
            # Always return generic success response (prevents user enumeration)
            return Response({
                "message": "If an account with that email exists, a password reset link has been sent."
            }, status=200)
        
        return Response(serializer.errors, status=400)


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Accepts token and new_password, resets password if token is valid and not expired.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                # Find token in database
                reset_token = PasswordResetToken.objects.get(token=token)
                
                # Check if token has expired
                if not reset_token.is_valid():
                    return Response({
                        "detail": "Invalid or expired link."
                    }, status=400)
                
                # Token is valid, update user password
                user = reset_token.user
                user.set_password(new_password)
                user.save()
                
                # Invalidate all existing tokens for this user to force re-login
                Token.objects.filter(user=user).delete()
                
                # Delete the used reset token to prevent reuse
                reset_token.delete()
                
                return Response({
                    "message": "Password reset successfully. You can now log in."
                }, status=200)
                
            except PasswordResetToken.DoesNotExist:
                # Token not found
                return Response({
                    "detail": "Invalid or expired link."
                }, status=400)
        
        return Response(serializer.errors, status=400)


# ========================
# MENU
# ========================
@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    categories = Category.objects.all()
    return Response(CategorySerializer(categories, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def menu_list(request):
    items = MenuItem.objects.filter(is_available=True)

    category = request.query_params.get('category')
    if category and category != "All":
        items = items.filter(category__name__iexact=category)

    search = request.query_params.get('search')
    if search:
        items = items.filter(name__icontains=search)

    sort = request.query_params.get('sort')
    if sort == "price-low":
        items = items.order_by("price")
    elif sort == "price-high":
        items = items.order_by("-price")
    elif sort == "rating":
        items = items.order_by("-rating")

    return Response(MenuItemSerializer(items, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def menu_detail(request, pk):
    try:
        item = MenuItem.objects.get(pk=pk)
        return Response(MenuItemDetailSerializer(item).data)
    except MenuItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


# ========================
# CART
# ========================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_view(request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    return Response(CartSerializer(cart).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_add(request):
    serializer = AddToCartSerializer(data=request.data)

    if serializer.is_valid():
        cart, _ = Cart.objects.get_or_create(user=request.user)

        item = MenuItem.objects.get(id=serializer.validated_data['menu_item_id'])

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            menu_item=item,
            defaults={"quantity": serializer.validated_data['quantity']}
        )

        if not created:
            cart_item.quantity += serializer.validated_data['quantity']
            cart_item.save()

        return Response(CartSerializer(cart).data)

    return Response(serializer.errors, status=400)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def cart_update(request, pk):
    try:
        item = CartItem.objects.get(pk=pk, cart__user=request.user)
        item.quantity = request.data.get("quantity", item.quantity)
        item.save()
        return Response(CartSerializer(item.cart).data)
    except CartItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cart_remove(request, pk):
    try:
        item = CartItem.objects.get(pk=pk, cart__user=request.user)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart).data)
    except CartItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


# ========================
# ORDERS
# ========================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order_list_create(request):

    if request.method == "GET":
        orders = Order.objects.filter(user=request.user)
        return Response(OrderSerializer(orders, many=True).data)

    cart = Cart.objects.get(user=request.user)
    items = cart.items.all()

    if not items.exists():
        return Response({"error": "Cart empty"}, status=400)

    subtotal = sum(i.subtotal for i in items)
    delivery = 80
    total = subtotal + delivery

    order = Order.objects.create(
        user=request.user,
        subtotal=subtotal,
        delivery_fee=delivery,
        total=total,
        status="placed",
        payment_method="cod",
        payment_status="completed",
        full_name=request.data.get("full_name", ""),
        phone=request.data.get("phone", ""),
        address=request.data.get("address", ""),
        city=request.data.get("city", "Kathmandu"),
        landmark=request.data.get("landmark", ""),
        notes=request.data.get("notes", ""),
    )

    for i in items:
        OrderItem.objects.create(
            order=order,
            menu_item=i.menu_item,
            quantity=i.quantity,
            price=i.menu_item.price
        )

    items.delete()

    return Response(OrderSerializer(order).data, status=201)


# ========================
# ORDER DETAIL
# ========================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)


# ========================
# KHALTI PAYMENT (TEST)
# ========================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    """
    Creates an order with payment_status='pending', then initiates
    a Khalti e-payment session. Returns the Khalti payment_url
    for the frontend to redirect the user to.
    """
    cart = Cart.objects.get(user=request.user)
    items = cart.items.all()

    if not items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    subtotal = sum(i.subtotal for i in items)
    delivery = 80
    total = subtotal + delivery

    # Create the order in 'pending' payment state
    order = Order.objects.create(
        user=request.user,
        subtotal=subtotal,
        delivery_fee=delivery,
        total=total,
        status="placed",
        payment_method="khalti",
        payment_status="pending",
        full_name=request.data.get("full_name", ""),
        phone=request.data.get("phone", ""),
        address=request.data.get("address", ""),
        city=request.data.get("city", "Kathmandu"),
        landmark=request.data.get("landmark", ""),
        notes=request.data.get("notes", ""),
    )

    for i in items:
        OrderItem.objects.create(
            order=order,
            menu_item=i.menu_item,
            quantity=i.quantity,
            price=i.menu_item.price,
        )

    # Khalti e-payment initiation (amount is in paisa: 1 NPR = 100 paisa)
    khalti_url = f"{settings.KHALTI_BASE_URL}/epayment/initiate/"
    payload = {
        "return_url": request.data.get(
            "return_url",
            f"http://localhost:8000/api/payments/verify/",
        ),
        "website_url": request.data.get("website_url", "http://localhost:5173"),
        "amount": int(total * 100),
        "purchase_order_id": str(order.id),
        "purchase_order_name": f"KTM Bites Order #{order.id}",
        "customer_info": {
            "name": order.full_name,
            "email": request.user.email,
            "phone": order.phone,
        },
    }
    headers = {"Authorization": f"Key {settings.KHALTI_SECRET_KEY}"}

    try:
        res = requests.post(khalti_url, json=payload, headers=headers, timeout=30)
        data = res.json()

        if res.status_code == 200 and "pidx" in data:
            order.pidx = data["pidx"]
            order.save(update_fields=["pidx"])
            # Clear cart only after successful initiation
            items.delete()
            return Response({
                "pidx": data["pidx"],
                "payment_url": data["payment_url"],
                "order_id": order.id,
            })
        else:
            # Khalti returned an error — mark order as failed
            order.payment_status = "failed"
            order.save(update_fields=["payment_status"])
            return Response(
                {"error": "Khalti initiation failed", "details": data},
                status=400,
            )
    except requests.RequestException as e:
        order.payment_status = "failed"
        order.save(update_fields=["payment_status"])
        return Response(
            {"error": "Could not connect to Khalti", "details": str(e)},
            status=502,
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_payment(request):
    """
    Khalti redirects the user's browser here after payment.
    We verify the payment server-to-server via the lookup API,
    then redirect to the frontend with the result.
    """
    pidx = request.GET.get("pidx")
    frontend_base = "http://localhost:5173"

    if not pidx:
        return Response({"error": "Missing pidx parameter"}, status=400)

    # Find the order by pidx
    try:
        order = Order.objects.get(pidx=pidx)
    except Order.DoesNotExist:
        return Response({"error": "No order found for this payment"}, status=404)

    # Already processed — don't double-process
    if order.payment_status == "completed":
        from django.shortcuts import redirect
        return redirect(f"{frontend_base}/order-success?order_id={order.id}")

    # Server-to-server lookup with Khalti
    lookup_url = f"{settings.KHALTI_BASE_URL}/epayment/lookup/"
    headers = {"Authorization": f"Key {settings.KHALTI_SECRET_KEY}"}

    try:
        res = requests.post(lookup_url, json={"pidx": pidx}, headers=headers, timeout=30)
        data = res.json()
    except requests.RequestException:
        from django.shortcuts import redirect
        return redirect(f"{frontend_base}/payment-failed?order_id={order.id}&reason=lookup_error")

    if data.get("status") == "Completed":
        order.payment_status = "completed"
        order.transaction_id = data.get("transaction_id", "")
        order.save(update_fields=["payment_status", "transaction_id"])
        from django.shortcuts import redirect
        return redirect(f"{frontend_base}/order-success?order_id={order.id}")
    else:
        order.payment_status = "failed"
        order.save(update_fields=["payment_status"])
        from django.shortcuts import redirect
        return redirect(f"{frontend_base}/payment-failed?order_id={order.id}&reason={data.get('status', 'unknown')}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status_view(request, order_id):
    """
    Allows the frontend to poll the payment status of an order.
    """
    try:
        order = Order.objects.get(pk=order_id, user=request.user)
        return Response({
            "order_id": order.id,
            "payment_status": order.payment_status,
            "payment_method": order.payment_method,
            "pidx": order.pidx,
            "transaction_id": order.transaction_id,
            "total": str(order.total),
        })
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)


# ========================
# ADMIN VIEWS
# ========================
@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_orders_list(request):
    """List all orders for admin dashboard."""
    orders = Order.objects.all()

    # Optional filters
    status_filter = request.query_params.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)

    payment_filter = request.query_params.get('payment_status')
    if payment_filter:
        orders = orders.filter(payment_status=payment_filter)

    return Response(OrderSerializer(orders, many=True).data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAdmin])
def admin_order_detail(request, pk):
    """View or update a single order (admin can change status)."""
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    if request.method == 'GET':
        return Response(OrderSerializer(order).data)

    # PUT — update order status
    new_status = request.data.get('status')
    if new_status and new_status in dict(Order.STATUS_CHOICES):
        order.status = new_status
        order.save(update_fields=['status'])
        return Response(OrderSerializer(order).data)

    return Response({"error": "Invalid status"}, status=400)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_users_list(request):
    """List all users for admin dashboard."""
    users = User.objects.all().order_by('-date_joined')
    data = []
    for u in users:
        data.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.first_name,
            "phone": u.last_name,
            "is_staff": u.is_staff,
            "is_superuser": u.is_superuser,
            "date_joined": u.date_joined,
            "order_count": u.orders.count(),
        })
    return Response(data)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def admin_menu_items(request):
    """CRUD for menu items (admin)."""
    if request.method == 'GET':
        items = MenuItem.objects.all()
        return Response(MenuItemSerializer(items, many=True).data)

    if request.method == 'POST':
        serializer = MenuItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    # PUT and DELETE require an 'id' in the request body
    item_id = request.data.get('id')
    if not item_id:
        return Response({"error": "id is required"}, status=400)

    try:
        item = MenuItem.objects.get(pk=item_id)
    except MenuItem.DoesNotExist:
        return Response({"error": "Menu item not found"}, status=404)

    if request.method == 'PUT':
        serializer = MenuItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == 'DELETE':
        item.delete()
        return Response({"message": "Deleted"}, status=204)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def admin_categories(request):
    """CRUD for categories (admin)."""
    if request.method == 'GET':
        categories = Category.objects.all()
        return Response(CategorySerializer(categories, many=True).data)

    if request.method == 'POST':
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    cat_id = request.data.get('id')
    if not cat_id:
        return Response({"error": "id is required"}, status=400)

    try:
        category = Category.objects.get(pk=cat_id)
    except Category.DoesNotExist:
        return Response({"error": "Category not found"}, status=404)

    if request.method == 'PUT':
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == 'DELETE':
        category.delete()
        return Response({"message": "Deleted"}, status=204)
