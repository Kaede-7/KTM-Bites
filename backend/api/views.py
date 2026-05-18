# ============================================================
# views.py - The "brain" of the backend
# ============================================================
import json
import os
from django.contrib.auth.hashers import make_password, check_password
import requests
import secrets
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from groq import Groq
from django.shortcuts import redirect as django_redirect

from .models import (
    Category, MenuItem, Cart, CartItem,
    Order, OrderItem, UserProfile, PasswordResetToken, RiderProfile,
    Notification,
)

from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    CategorySerializer, MenuItemSerializer, MenuItemDetailSerializer,
    CartSerializer, AddToCartSerializer, UpdateCartItemSerializer,
    OrderSerializer, PlaceOrderSerializer, RiderProfileSerializer,
    NotificationSerializer,
)

# ========================
# ADMIN PERMISSION
# ========================
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.is_superuser
        )

class IsStaffOrAuthorizedRole(BasePermission):
    def has_permission(self, request, view):
        # Check for our custom Rider Token (with or without Bearer prefix)
        auth_header = request.headers.get('Authorization', '')
        if 'RIDER_TOKEN_' in auth_header:
            return True

        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        try:
            return request.user.profile.role in ['ADMIN', 'KITCHEN', 'RIDER']
        except Exception:
            return False

# ========================
# THROTTLING
# ========================
class ForgotPasswordThrottle(UserRateThrottle):
    scope = 'forgot_password'

# ========================
# EMAIL UTILITIES
# ========================
def send_password_reset_email(user, token):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}/reset-password?token={token}"
    subject = "Password Reset Request — KTM Bites"
    
    name = user.first_name or "there"
    
    # Professional Plain Text version
    message = (
        f"Hello {name},\n\n"
        f"We received a request to reset the password for your KTM Bites account.\n\n"
        f"To choose a new password, please use the following link:\n"
        f"{reset_url}\n\n"
        f"This link will expire in 60 minutes. If you did not request this change, you can safely ignore this email.\n\n"
        f"Best regards,\n"
        f"The KTM Bites Team"
    )
    
    # Premium HTML version
    html_message = f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 40px auto; padding: 30px; border: 1px solid #eef0f2; border-radius: 16px; color: #2d3436; line-height: 1.6;">
        <h2 style="color: #2a2420; font-size: 22px; margin-bottom: 20px; font-weight: 800;">Password Reset Request</h2>
        <p style="margin-bottom: 24px;">Hello <strong>{name}</strong>,</p>
        <p style="margin-bottom: 24px;">We received a request to reset the password for your KTM Bites account. Click the button below to choose a new password and regain access:</p>
        
        <div style="text-align: center; margin: 36px 0;">
            <a href='{reset_url}' style="background: linear-gradient(135deg, #f28b46 0%, #e06c22 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(242, 139, 70, 0.2);">Reset Password</a>
        </div>
        
        <p style="font-size: 13px; color: #636e72; margin-top: 32px; border-top: 1px solid #f1f3f5; padding-top: 20px;">
            <strong>Security Note:</strong> This link will expire in 60 minutes. If you did not request this change, you can safely ignore this email; no changes will be made to your account.
        </p>
        
        <p style="margin-top: 24px; font-size: 14px; font-weight: 600; color: #2a2420;">
            Best regards,<br>
            <span style="color: #f28b46;">The KTM Bites Team</span>
        </p>
    </div>
    """
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], html_message=html_message)
        return True
    except Exception as e:
        print(f"ERROR: Failed to send email to {user.email}: {e}")
        return False

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

    print(f"Registration Error: {serializer.errors}")
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
            role = "USER"
            if hasattr(user, 'profile'):
                try:
                    role = user.profile.role
                except Exception:
                    pass
            
            return Response({
                "token": token.key,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.first_name or user.username.split('@')[0].capitalize(),
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                    "role": role,
                }
            })

        return Response({"error": "Invalid credentials"}, status=401)

    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_view(request):
    credential = request.data.get('credential')
    access_token = request.data.get('access_token')
    role = request.data.get('role', 'USER')

    if not credential and not access_token:
        return Response({'error': 'No credential provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if credential:
            # Verify the ID token
            idinfo = id_token.verify_oauth2_token(credential, google_requests.Request())
        else:
            # Verify via access token
            res = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers={'Authorization': f'Bearer {access_token}'})
            idinfo = res.json()
        
        email = idinfo.get('email')
        if not email:
            return Response({'error': 'Google token did not contain an email'}, status=status.HTTP_400_BAD_REQUEST)

        # Better name extraction
        # Try given_name, then first part of full name, then first part of email
        first_name = idinfo.get('given_name')
        last_name = idinfo.get('family_name')
        full_name_from_google = idinfo.get('name', '')

        if not first_name:
            if full_name_from_google:
                parts = full_name_from_google.split(' ')
                first_name = parts[0]
                if len(parts) > 1 and not last_name:
                    last_name = ' '.join(parts[1:])
            else:
                first_name = email.split('@')[0].capitalize()

        if not last_name:
            last_name = ''
            
        # Get or create user
        user = User.objects.filter(email=email).first()
        if not user:
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
            )
            user.set_unusable_password()
            user.save()
            # Create profile and set the role
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.save()
            Cart.objects.get_or_create(user=user)
        else:
            # Update name if currently empty
            updated = False
            if not user.first_name and first_name:
                user.first_name = first_name
                updated = True
            if not user.last_name and last_name:
                user.last_name = last_name
                updated = True
            if updated:
                user.save()

            # Upgrade existing user role if requested (e.g. USER -> RIDER)
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if profile.role == 'USER' and role in ['RIDER', 'KITCHEN']:
                profile.role = role
                profile.save()
            
        token, _ = Token.objects.get_or_create(user=user)
        Cart.objects.get_or_create(user=user)
        
        role_response = "USER"
        if hasattr(user, 'profile'):
            try:
                role_response = user.profile.role
            except Exception:
                pass

        # SPECIAL HANDLING FOR RIDERS
        # Only return a RIDER_TOKEN if the frontend specifically requested the RIDER role
        # (e.g. from the Rider Login page). If they are logging in from the main site,
        # we give them a standard token so they can order food, even if they are a rider.
        if role == 'RIDER':
            rider_profile, _ = RiderProfile.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': f"{user.first_name} {user.last_name}".strip() or email.split('@')[0],
                    'username': email,
                    'password': make_password(secrets.token_urlsafe(16)),
                }
            )
            return Response({
                "token": f"RIDER_TOKEN_{rider_profile.id}",
                "user": {
                    "id": rider_profile.id,
                    "email": rider_profile.email,
                    "full_name": rider_profile.full_name,
                    "role": "RIDER",
                }
            })

        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.first_name or user.username or "User",
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "role": role_response,
            }
        })
        
    except ValueError as e:
        print(f"[Google Login] ValueError: {e}")
        return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"[Google Login] Exception: {type(e).__name__}: {e}")
        return Response({'error': f'Google login error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



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
            "full_name": user.first_name or user.username.split('@')[0].capitalize(),
            "phone": profile.phone,
            "address": profile.address,
            "city": profile.city,
            "bio": profile.bio,
            "has_password": user.has_usable_password(),
            "rank": profile.rank_data,
        })

    user.first_name = request.data.get('full_name', user.first_name)
    # Don't update last_name here as it's handled by profile.phone now, 
    # but we keep user.last_name for actual last name if needed.
    if 'phone' in request.data:
        profile.phone = request.data.get('phone', profile.phone)

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
                
                # Calculate expiry: 60 minutes from now
                expires_at = timezone.now() + timezone.timedelta(minutes=60)
                
                # Save token to database
                PasswordResetToken.objects.create(
                    user=user,
                    token=token,
                    expires_at=expires_at
                )
                
                # Send email
                sent = send_password_reset_email(user, token)
                if not sent:
                    return Response({
                        "error": "Failed to send reset email. SMTP configuration might be incorrect or blocked."
                    }, status=500)
                
            except User.DoesNotExist:
                print(f"Forgot Password: User with email {email} not found.")
                return Response({
                    "detail": "No account found with this email address."
                }, status=404)
            
            return Response({
                "message": "A password reset link has been sent to your email."
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
    # Optimize: select_related('category') joins the tables in one query
    items = MenuItem.objects.select_related('category').filter(is_available=True)

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
        # Optimize: prefetch_related('items') fetches all order items in one batch
        orders = Order.objects.prefetch_related('items', 'items__menu_item').filter(user=request.user)
        return Response(OrderSerializer(orders, many=True).data)

    # Cash on Delivery (COD) is completely disabled.
    return Response(
        {"error": "Cash on Delivery is not supported. Please place your order using digital payment methods (Khalti or Kharcha)."},
        status=status.HTTP_400_BAD_REQUEST
    )


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
# ORDER CANCEL (5-min window)
# ========================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, pk):
    """Allow user to cancel an order within 5 minutes of placing it."""
    from django.utils import timezone
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    if order.status != 'placed':
        return Response({"error": "Order cannot be cancelled at this stage."}, status=400)

    elapsed = (timezone.now() - order.created_at).total_seconds()
    if elapsed > 300:  # 5 minutes = 300 seconds
        return Response({"error": "Cancellation window has expired (5 minutes)."}, status=400)

    order.status = 'cancelled'
    order.save(update_fields=['status'])
    return Response({"message": "Order cancelled successfully.", "order": OrderSerializer(order).data})


# ========================
# RIDER RATING & REVIEW
# ========================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_rider_view(request, pk):
    """Allows user to rate and comment on the rider assigned to their order."""
    from .models import RiderReview
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    if not order.rider:
        return Response({"error": "No rider is assigned to this order."}, status=400)

    # Check if already reviewed
    if RiderReview.objects.filter(order=order, user=request.user).exists():
        return Response({"error": "You have already reviewed the rider for this order."}, status=400)

    rating = request.data.get('rating')
    comment = request.data.get('comment', '')

    if rating is None:
        return Response({"error": "Rating is required."}, status=400)

    try:
        rating_val = float(rating)
        if not (0.0 <= rating_val <= 5.0):
            raise ValueError
    except ValueError:
        return Response({"error": "Rating must be a number between 0.0 and 5.0."}, status=400)

    # Create review
    review = RiderReview.objects.create(
        rider=order.rider,
        user=request.user,
        order=order,
        rating=rating_val,
        comment=comment
    )

    # Update rider's average rating and count
    order.rider.update_rating()

    return Response({
        "message": "Rider rated successfully!",
        "has_reviewed_rider": True,
        "rider_info": {
            "id": order.rider.id,
            "name": order.rider.full_name,
            "phone": order.rider.phone,
            "vehicle_type": order.rider.vehicle_type,
            "rating": float(order.rider.rating),
            "rating_count": order.rider.rating_count
        }
    })


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
    try:
        cart = Cart.objects.get(user=request.user)
        items = cart.items.all()
    except Cart.DoesNotExist:
        return Response({"error": "Cart not found"}, status=404)

    if not items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    subtotal = sum(i.subtotal for i in items)
    delivery = 80

    # Apply Rank Discount
    rank_info = request.user.profile.rank_data
    discount_amount = (subtotal * rank_info['discount']) / 100
    
    delivery = 80
    if rank_info['current_rank'] == 'Mythic Crimson':
        delivery = 0
        
    total = (subtotal - discount_amount) + delivery

    # Create the order in 'pending' payment state
    order = Order.objects.create(
        user=request.user,
        subtotal=subtotal,
        delivery_fee=delivery,
        discount_amount=discount_amount,
        rank_applied=rank_info['current_rank'],
        total=total,
        status="pending_payment",
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
            f"{settings.BACKEND_BASE_URL}/api/payments/verify/",
        ),
        "website_url": request.data.get("website_url", settings.FRONTEND_BASE_URL),
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
            print(f"Khalti Error: Status {res.status_code}, Data: {data}")
            order.payment_status = "failed"
            order.save(update_fields=["payment_status"])
            return Response(
                {"error": "Khalti initiation failed", "details": data, "khalti_status": res.status_code},
                status=400,
            )
    except requests.RequestException as e:
        order.payment_status = "failed"
        order.save(update_fields=["payment_status"])
        return Response(
            {"error": "Could not connect to Khalti", "details": str(e)},
            status=502,
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_view(request, pk):
    """
    Allows a user to update order details (address, phone, notes, payment method)
    before they have completed payment.
    """
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    if order.payment_status == 'completed':
        return Response({"error": "Cannot update a paid order"}, status=400)

    # Fields allowed to be updated
    allowed_fields = ['full_name', 'phone', 'address', 'city', 'landmark', 'notes', 'payment_method']
    updated_fields = []

    for field in allowed_fields:
        if field in request.data:
            setattr(order, field, request.data[field])
            updated_fields.append(field)

    if updated_fields:
        order.save(update_fields=updated_fields)

    return Response(OrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reinitiate_payment_view(request, pk):
    """
    Allows a user to retry payment for an existing order that is stuck in 'pending_payment'.
    Currently supports Khalti and Kharcha.
    """
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    if order.status != 'pending_payment' and order.payment_status == 'completed':
        return Response({"error": "Order is already paid or in progress"}, status=400)

    # ── Khalti Re-initiation ──────────────────────────────────────
    if order.payment_method == 'khalti':
        khalti_url = f"{settings.KHALTI_BASE_URL}/epayment/initiate/"
        payload = {
            "return_url": request.data.get(
                "return_url",
                f"{settings.BACKEND_BASE_URL}/api/payments/verify/",
            ),
            "website_url": request.data.get("website_url", settings.FRONTEND_BASE_URL),
            "amount": int(order.total * 100),
            "purchase_order_id": f"{order.id}_{int(timezone.now().timestamp())}",
            "purchase_order_name": f"KTM Bites Order #{order.id} (Retry)",
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
                order.payment_status = "pending" # Reset to pending
                order.save(update_fields=["pidx", "payment_status"])
                return Response({
                    "pidx": data["pidx"],
                    "payment_url": data["payment_url"],
                    "order_id": order.id,
                })
            else:
                return Response({"error": "Khalti re-initiation failed", "details": data}, status=400)
        except Exception as e:
            return Response({"error": "Connection to Khalti failed", "details": str(e)}, status=502)

    # ── Kharcha Re-initiation ─────────────────────────────────────
    elif order.payment_method in ['kharcha', 'kharcha_portal', 'kharcha_linked']:
        backend_base  = getattr(settings, 'BACKEND_BASE_URL', 'http://localhost:8000')
        return_url    = f"{backend_base}/api/kharcha/portal/callback/"
        
        try:
            res = requests.post(
                f"{settings.KHARCHA_BASE_URL}/api/pay-portal/sessions/create",
                headers={
                    "X-API-Key":    settings.KHARCHA_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "amount":       float(order.total),
                    "note":         f"KTM Bites Order #{order.id} (Retry)",
                    "return_url":   return_url,
                },
                timeout=15,
            )
            data = res.json()
            if data.get("success"):
                order.kharcha_payment_id = data["session_id"]
                order.payment_status = "pending"
                order.save(update_fields=["kharcha_payment_id", "payment_status"])
                return Response({
                    "checkout_url": data["checkout_url"],
                    "order_id":     order.id,
                })
            else:
                return Response({"error": "Kharcha re-initiation failed", "details": data}, status=400)
        except Exception as e:
            return Response({"error": "Connection to Kharcha failed", "details": str(e)}, status=502)

    return Response({"error": "Unsupported payment method for retry"}, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([])
def verify_payment(request):
    """
    Khalti redirects the user's browser here after payment.
    We verify the payment server-to-server via the lookup API,
    then redirect to the frontend with the result.
    """
    pidx = request.GET.get("pidx")
    frontend_base = settings.FRONTEND_BASE_URL

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
        return django_redirect(f"{frontend_base}/order-success?order_id={order.id}")

    # Server-to-server lookup with Khalti
    lookup_url = f"{settings.KHALTI_BASE_URL}/epayment/lookup/"
    headers = {"Authorization": f"Key {settings.KHALTI_SECRET_KEY}"}

    try:
        res = requests.post(lookup_url, json={"pidx": pidx}, headers=headers, timeout=30)
        data = res.json()
    except requests.RequestException:
        from django.shortcuts import redirect
        return django_redirect(f"{frontend_base}/payment-failed?order_id={order.id}&reason=lookup_error")

    if data.get("status") == "Completed":
        order.payment_status = "completed"
        order.status = "placed"  # Mark as placed only after payment
        order.transaction_id = data.get("transaction_id", "")
        order.save(update_fields=["payment_status", "status", "transaction_id"])

        # Notify user
        create_notification(
            order.user, 'order_placed',
            'Order Placed! 🎉',
            f'Your order #{order.order_id} has been placed successfully. We\'re getting it ready!',
            order=order,
        )

        from django.shortcuts import redirect
        return django_redirect(f"{frontend_base}/order-tracking/{order.id}")
    else:
        order.payment_status = "failed"
        # Keep order in pending_payment so user can retry — do NOT cancel
        order.save(update_fields=["payment_status"])
        from django.shortcuts import redirect
        return django_redirect(f"{frontend_base}/checkout?payment_failed=1&orderId={order.id}")


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
@permission_classes([IsStaffOrAuthorizedRole])
def admin_orders_list(request):
    """List orders for admin dashboard. Riders only see pickup-ready or their own orders."""
    auth_header = request.headers.get('Authorization', '')
    is_rider_token = 'RIDER_TOKEN_' in auth_header
    
    # OPTIMIZE: Use select_related and prefetch_related to solve N+1 problems.
    # This reduces 1200+ database round-trips to just 3-4.
    orders = Order.objects.select_related('rider', 'user').prefetch_related(
        'items', 
        'items__menu_item',
        'items__menu_item__category'
    ).all().order_by('-created_at')

    if is_rider_token:
        rider_id = auth_header.split('RIDER_TOKEN_')[-1].strip()
        from django.db.models import Q
        orders = orders.filter(
            Q(status='ready_for_pickup') | Q(rider_id=rider_id)
        )

    # Optional filters (supports multiple statuses like ?status=placed,preparing)
    status_filter = request.query_params.get('status')
    if status_filter:
        statuses = status_filter.split(',')
        if len(statuses) > 1:
            orders = orders.filter(status__in=statuses)
        else:
            orders = orders.filter(status=statuses[0])

    return Response(OrderSerializer(orders, many=True).data)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsStaffOrAuthorizedRole])
def admin_order_detail(request, pk):
    """View or update a single order."""
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    if request.method == 'GET':
        return Response(OrderSerializer(order).data)

    auth_header = request.headers.get('Authorization', '')
    is_rider_token = 'RIDER_TOKEN_' in auth_header

    # PUT or PATCH — update order status
    new_status = request.data.get('status')
    if new_status and new_status in dict(Order.STATUS_CHOICES):
        order.status = new_status
        
        # If a rider picks up the order, assign it to them
        if new_status == 'on_way' and is_rider_token:
            rider_id = auth_header.split('RIDER_TOKEN_')[-1].strip()
            try:
                rider_profile = RiderProfile.objects.get(id=rider_id)
                order.rider = rider_profile
            except RiderProfile.DoesNotExist:
                pass
                
        order.save()

        # Create notification for user about status change
        STATUS_NOTIF_MAP = {
            'preparing': ('order_preparing', 'Being Prepared 👨‍🍳', 'Your order #{oid} is now being prepared by our chefs!'),
            'ready_for_pickup': ('order_ready', 'Ready for Pickup! 📦', 'Your order #{oid} is ready and waiting for a rider.'),
            'on_way': ('order_on_way', 'On the Way! 🚗', 'Your order #{oid} is on the way to you. Track it live!'),
            'delivered': ('order_delivered', 'Delivered! ✅', 'Your order #{oid} has been delivered. Enjoy your meal!'),
            'cancelled': ('order_cancelled', 'Order Cancelled', 'Your order #{oid} has been cancelled.'),
        }
        if new_status in STATUS_NOTIF_MAP:
            ntype, ntitle, nmsg = STATUS_NOTIF_MAP[new_status]
            create_notification(
                order.user, ntype,
                ntitle,
                nmsg.replace('#{oid}', f'#{order.order_id}'),
                order=order,
            )

        return Response(OrderSerializer(order).data)

    return Response({"error": "Invalid status"}, status=400)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def admin_users_list(request):
    """CRUD for users (admin)."""
    if request.method == 'GET':
        users = User.objects.all().order_by('-date_joined')
        data = []
        for u in users:
            profile = getattr(u, 'profile', None)
            data.append({
                "id": u.id,
                "email": u.email,
                "full_name": u.first_name,
                "phone": profile.phone if profile else "",
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
                "date_joined": u.date_joined,
                "order_count": u.orders.count(),
            })
        return Response(data)

    if request.method == 'POST':
        # Create a new user
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({"error": "Email and password are required"}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already in use"}, status=400)
            
        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=request.data.get('full_name', ''),
        )
        UserProfile.objects.get_or_create(user=user, defaults={'phone': request.data.get('phone', '')})
        Cart.objects.get_or_create(user=user)
        return Response({"message": "User created successfully", "id": user.id}, status=201)

    # For PUT and DELETE, id is required
    user_id = request.data.get('id')
    if not user_id:
        return Response({"error": "id is required"}, status=400)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if request.method == 'PUT':
        # Update user
        if 'full_name' in request.data:
            user.first_name = request.data['full_name']
        if 'email' in request.data:
            new_email = request.data['email']
            if new_email != user.email and User.objects.filter(email=new_email).exists():
                return Response({"error": "Email already in use"}, status=400)
            user.email = new_email
        if 'password' in request.data and request.data['password']:
            user.set_password(request.data['password'])
        
        user.save()

        if 'phone' in request.data:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.phone = request.data['phone']
            profile.save()
            
        return Response({"message": "User updated successfully"})

    if request.method == 'DELETE':
        user.delete()
        return Response({"message": "User deleted successfully"}, status=204)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def admin_riders_list(request):
    """CRUD for riders (admin)."""
    if request.method == 'GET':
        riders = RiderProfile.objects.all().order_by('full_name')
        serializer = RiderProfileSerializer(riders, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        # Create a new rider
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({"error": "Email and password are required"}, status=400)
        if RiderProfile.objects.filter(email=email).exists():
            return Response({"error": "Email already in use"}, status=400)
            
        rider = RiderProfile.objects.create(
            full_name=request.data.get('full_name', ''),
            email=email,
            username=email,
            password=make_password(password),
            phone=request.data.get('phone', ''),
            vehicle_type=request.data.get('vehicle_type', ''),
            license_number=request.data.get('license_number', '')
        )
        return Response({"message": "Rider created successfully", "id": rider.id}, status=201)

    # For PUT and DELETE, id is required
    rider_id = request.data.get('id')
    if not rider_id:
        return Response({"error": "id is required"}, status=400)

    try:
        rider = RiderProfile.objects.get(pk=rider_id)
    except RiderProfile.DoesNotExist:
        return Response({"error": "Rider not found"}, status=404)

    if request.method == 'PUT':
        # Update rider
        rider.full_name = request.data.get('full_name', rider.full_name)
        new_email = request.data.get('email', rider.email)
        if new_email != rider.email and RiderProfile.objects.filter(email=new_email).exists():
            return Response({"error": "Email already in use"}, status=400)
        rider.email = new_email
        rider.username = new_email
        
        if 'password' in request.data and request.data['password']:
            rider.password = make_password(request.data['password'])
        
        rider.phone = request.data.get('phone', rider.phone)
        rider.vehicle_type = request.data.get('vehicle_type', rider.vehicle_type)
        rider.license_number = request.data.get('license_number', rider.license_number)
        rider.is_available = request.data.get('is_available', rider.is_available)
        
        rider.save()
        return Response({"message": "Rider updated successfully"})

    if request.method == 'DELETE':
        rider.delete()
        return Response({"message": "Rider deleted successfully"}, status=204)


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


# ========================
# AI — CHAT CONCIERGE
# ========================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_view(request):
    """
    Accepts a user message + chat history.
    Returns an AI reply and a list of recommended menu items (with IDs).
    Uses Groq (llama-3.3-70b-versatile) — free, no extra frameworks.
    """

    user_message = request.data.get('message', '').strip()
    history = request.data.get('history', [])

    if not user_message:
        return Response({"error": "No message provided"}, status=400)

    # Build menu context (all available items)
    menu_items = MenuItem.objects.filter(is_available=True).select_related('category')
    menu_context = [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category.name,
            "price": str(item.price),
            "description": item.description,
            "rating": str(item.rating),
        }
        for item in menu_items
    ]

    system_prompt = f"""You are a friendly food concierge for KTM Bites, a food delivery service in Kathmandu, Nepal.

Here is the full menu (JSON):
{json.dumps(menu_context, ensure_ascii=False)}

Your job:
1. Answer questions about the menu warmly and helpfully.
2. Make recommendations based on user preferences (dietary needs, budget, mood, etc.).
3. When you recommend specific items, always end your response with a JSON block like this (after your text):
   [ITEMS]: [{{"id": 1}}, {{"id": 5}}]
   Only include item IDs that actually exist in the menu above.
4. If no specific items to recommend, omit the [ITEMS] block.
5. Keep responses concise (2-4 sentences) and conversational.
6. Prices are in Nepalese Rupees (Rs.).
7. IMPORTANT: You must ONLY answer questions related to KTM Bites — the menu, food items, ingredients, dietary info, delivery, ordering, and recommendations. If a user asks about anything unrelated (e.g. coding, math, general knowledge, politics, etc.), politely decline and redirect them back to the menu. Example: "I'm here to help you find the perfect meal! 🍜 What kind of food are you in the mood for?"
8. Never answer questions that are not about KTM Bites or its food service."""

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-10:]:
        if h.get('role') in ('user', 'assistant'):
            messages.append({"role": h['role'], "content": h['content']})
    messages.append({"role": "user", "content": user_message})

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=512,
        )
        raw_reply = completion.choices[0].message.content or ""
    except Exception as e:
        import traceback; traceback.print_exc()
        return Response({"error": str(e), "reply": f"⚠️ Debug: {str(e)}", "items": []}, status=200)

    # Parse optional [ITEMS] block from reply
    reply_text = raw_reply
    recommended_items = []

    if "[ITEMS]:" in raw_reply:
        parts = raw_reply.split("[ITEMS]:", 1)
        reply_text = parts[0].strip()
        try:
            item_ids_raw = parts[1].strip()
            item_ids = [obj['id'] for obj in json.loads(item_ids_raw)]
            items_qs = MenuItem.objects.filter(id__in=item_ids, is_available=True)
            item_map = {i.id: i for i in items_qs}
            for iid in item_ids:
                if iid in item_map:
                    m = item_map[iid]
                    recommended_items.append({
                        "id": m.id,
                        "name": m.name,
                        "price": str(m.price),
                        "image": m.image,
                    })
        except Exception:
            pass  # Malformed JSON from AI — just skip items

    return Response({"reply": reply_text, "items": recommended_items})


# ========================
# AI — RECOMMENDATIONS
# ========================
from django.core.cache import cache

@api_view(['GET'])
@permission_classes([AllowAny])
def recommendations_view(request):
    """
    Returns 3 AI-recommended menu items based on past history, time, and weather.
    Cached for performance (Weather: 30m, User Recs: 10m).
    """
    user_cache_key = f"user_recs_{request.user.id}"
    cached_recs = cache.get(user_cache_key)
    if cached_recs:
        weather_context = cache.get("ktm_weather_context") or "Pleasant"
        return Response({
            "recommendations": cached_recs,
            "weather": weather_context
        })

    # 1. User's recent order history
    order_history = []
    if request.user.is_authenticated:
        recent_items = (
            OrderItem.objects
            .filter(order__user=request.user)
            .select_related('menu_item')
            .order_by('-order__created_at')[:15]
        )
        order_history = list({oi.menu_item.name for oi in recent_items})

    # 2. Time context
    hour = datetime.now().hour
    if hour < 11: time_context = "morning"
    elif hour < 15: time_context = "lunch"
    elif hour < 18: time_context = "afternoon snack"
    else: time_context = "dinner"

    # 3. Weather (Kathmandu) — Cache for 30 mins
    weather_cache_key = "ktm_weather_context"
    weather_context = cache.get(weather_cache_key)
    
    if not weather_context:
        if settings.OPENWEATHER_API_KEY:
            try:
                weather_resp = requests.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"q": "Kathmandu", "appid": settings.OPENWEATHER_API_KEY, "units": "metric"},
                    timeout=2,
                )
                if weather_resp.status_code == 200:
                    wd = weather_resp.json()
                    temp = wd['main']['temp']
                    desc = wd['weather'][0]['description'].capitalize()
                    weather_context = f"{desc}, {temp:.0f}°C"
                    cache.set(weather_cache_key, weather_context, 1800)
            except Exception:
                pass
        
        # Final fallback if API fails or key is missing
        if not weather_context:
            weather_context = "Pleasant"

    # 4. Full menu for AI context
    menu_items = MenuItem.objects.filter(is_available=True).select_related('category')
    menu_context = [
        {"id": item.id, "name": item.name, "category": item.category.name, "price": str(item.price)}
        for item in menu_items
    ]

    prompt = f"""Generate exactly 3 food recommendations for KTM Bites.
You must pick:
1. One item perfectly suited for the current time ({time_context}).
2. One item based on the user's past orders ({', '.join(order_history) if order_history else 'No history yet, pick a popular item'}).
3. One item ideally suited for the current weather ({weather_context}).

Menu: {json.dumps(menu_context[:40])}

Return ONLY a JSON list of 3 objects:
[{{"id": item_id, "reason": "short explanation", "type": "Time-based" | "History-based" | "Weather-based"}}]"""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=256,
        )
        recs_raw = json.loads(completion.choices[0].message.content)
    except Exception:
        recs_raw = [{"id": m.id, "reason": "Chef's choice"} for m in menu_items[:3]]

    # Build response
    item_ids = [r['id'] for r in recs_raw if isinstance(r.get('id'), int)]
    reason_map = {r['id']: r.get('reason', '') for r in recs_raw if isinstance(r.get('id'), int)}
    type_map = {r['id']: r.get('type', 'AI Pick') for r in recs_raw if isinstance(r.get('id'), int)}
    
    items_qs = MenuItem.objects.filter(id__in=item_ids, is_available=True)
    item_map = {i.id: i for i in items_qs}

    recommendations = []
    for iid in item_ids:
        if iid in item_map:
            m = item_map[iid]
            recommendations.append({
                "id": m.id, "name": m.name, "price": str(m.price),
                "image": m.image, 
                "reason": reason_map.get(iid, ''),
                "type": type_map.get(iid, 'AI Pick'),
            })

    # Cache user recommendations for 10 minutes
    cache.set(user_cache_key, recommendations, 600)
    return Response({
        "recommendations": recommendations,
        "weather": weather_context
    })


# ════════════════════════════════════════════════════════════════
# RIDER GPS TRACKING
@api_view(['PUT'])
@permission_classes([AllowAny])
def update_rider_location(request):
    """
    Rider pings this endpoint with { lat, lng } to update
    their live GPS position while delivering an order.
    """
    auth_header = request.headers.get('Authorization', '')
    if 'RIDER_TOKEN_' not in auth_header:
        return Response({"error": "Unauthorized"}, status=401)
    
    rider_id = auth_header.split('RIDER_TOKEN_')[-1].strip()
    try:
        profile = RiderProfile.objects.get(id=rider_id)
    except RiderProfile.DoesNotExist:
        return Response({"error": "Rider not found"}, status=404)

    print(f"DEBUG: Updating location for rider {rider_id}: lat={request.data.get('lat')}, lng={request.data.get('lng')}")
    profile.current_lat = request.data.get('lat')
    profile.current_lng = request.data.get('lng')
    profile.save(update_fields=['current_lat', 'current_lng'])

    return Response({"status": "ok"})

@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def rider_profile_view(request):
    auth_header = request.headers.get('Authorization', '')
    if 'RIDER_TOKEN_' not in auth_header:
        return Response({"error": "Unauthorized"}, status=401)
    
    rider_id = auth_header.split('RIDER_TOKEN_')[-1].strip()
    try:
        profile = RiderProfile.objects.get(id=rider_id)
    except RiderProfile.DoesNotExist:
        return Response({"error": "Rider not found"}, status=404)

    if request.method == 'GET':
        return Response({
            "full_name": profile.full_name,
            "email": profile.email,
            "phone": profile.phone,
            "vehicle_type": profile.vehicle_type,
            "license_number": profile.license_number,
            "is_available": profile.is_available,
            "rating": float(profile.rating),
            "rating_count": profile.rating_count
        })

    if request.method == 'PUT':
        data = request.data
        profile.full_name = data.get('full_name', profile.full_name)
        profile.phone = data.get('phone', profile.phone)
        profile.vehicle_type = data.get('vehicle_type', profile.vehicle_type)
        profile.license_number = data.get('license_number', profile.license_number)
        profile.is_available = data.get('is_available', profile.is_available)
        profile.save()

        return Response({"message": "Profile updated successfully"})


@api_view(['POST'])
@permission_classes([AllowAny])
def rider_register_view(request):
    data = request.data
    email = data.get('email', '').strip().lower()
    
    if RiderProfile.objects.filter(email=email).exists():
        return Response({'error': 'This email is already registered as a rider.'}, status=400)
    
    rider = RiderProfile.objects.create(
        full_name=data.get('full_name', '').strip(),
        email=email,
        username=email,
        password=make_password(data.get('password')),
        phone=data.get('phone', '').strip()
    )
    
    return Response({
        'token': f'RIDER_TOKEN_{rider.id}',
        'user': {
            'id': rider.id,
            'email': rider.email,
            'full_name': rider.full_name,
            'role': 'RIDER'
        }
    }, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def rider_login_view(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    
    try:
        rider = RiderProfile.objects.get(email__iexact=email)
        if check_password(password, rider.password):
            return Response({
                'token': f'RIDER_TOKEN_{rider.id}',
                'user': {
                    'id': rider.id,
                    'email': rider.email,
                    'full_name': rider.full_name,
                    'role': 'RIDER'
                }
            })
    except RiderProfile.DoesNotExist:
        pass
        
    return Response({'error': 'Invalid rider credentials. Please check your email and password.'}, status=401)

# ============================================================
# KHARCHA VIEWS
# Add this entire block to KTM-Bites/backend/api/views.py
# (paste at the end, before any existing admin views)
# ============================================================
#
# Requires these new env vars (see .env additions at the bottom
# of this file):
#   KHARCHA_BASE_URL, KHARCHA_CLIENT_ID, KHARCHA_CLIENT_SECRET,
#   KHARCHA_REDIRECT_URI
# ============================================================

# ============================================================
# SERVICE 1 — LINK KHARCHA ACCOUNT (OAuth)
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kharcha_link_status(request):
    """
    GET /api/kharcha/link/status/
    Returns whether the current user has a linked Kharcha account.
    """
    try:
        link = request.user.kharcha_account
        return Response({
            "linked": link.is_active,
            "linked_at": link.linked_at,
        })
    except Exception:
        return Response({"linked": False})

@api_view(['GET'])
@permission_classes([AllowAny])
def kharcha_link_start(request):
    """
    GET /api/kharcha/link/start/?token=<auth_token>
    Called via browser redirect (can't send Authorization header),
    so the frontend passes the DRF token as a query param instead.
    """
    from rest_framework.authtoken.models import Token

    raw_token = request.GET.get('token', '')
    try:
        token_obj = Token.objects.select_related('user').get(key=raw_token)
        user = token_obj.user
    except Token.DoesNotExist:
        return Response({"error": "Invalid or missing token."}, status=401)

    state = secrets.token_urlsafe(32)
    request.session['kharcha_oauth_state']   = state
    request.session['kharcha_oauth_user_id'] = user.id

    client_id    = settings.KHARCHA_CLIENT_ID
    redirect_uri = settings.KHARCHA_REDIRECT_URI

    consent_url = (
        f"{settings.KHARCHA_FRONTEND_URL}/oauth-consent"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
    )
    return django_redirect(consent_url)


@api_view(['GET'])
@permission_classes([AllowAny])
def kharcha_link_callback(request):
    """
    GET /api/kharcha/callback/
    Kharcha redirects here after the user approves.
    Exchanges the one-time code for a link_token and stores it.
    """
    code  = request.GET.get('code')
    state = request.GET.get('state')

    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')

    # ── CSRF state check ──────────────────────────────────────
    saved_state = request.session.get('kharcha_oauth_state')
    user_id     = request.session.get('kharcha_oauth_user_id')

    if not code or not state:
        return django_redirect(f"{frontend_base}/profile?kharcha_link=failed&reason=missing_params")

    if state != saved_state:
        return django_redirect(f"{frontend_base}/profile?kharcha_link=failed&reason=state_mismatch")

    # ── Exchange code for link_token ──────────────────────────
    import requests as http_requests
    try:
        res = http_requests.post(
            f"{settings.KHARCHA_BASE_URL}/api/oauth/token",
            json={
                "client_id":     settings.KHARCHA_CLIENT_ID,
                "client_secret": settings.KHARCHA_CLIENT_SECRET,
                "code":          code,
            },
            timeout=15,
        )
        data = res.json()
    except http_requests.RequestException as e:
        return django_redirect(
            f"{frontend_base}/profile?kharcha_link=failed&reason=network_error"
        )

    if not data.get('success'):
        return django_redirect(
            f"{frontend_base}/profile?kharcha_link=failed&reason=token_exchange_failed"
        )

    link_token       = data['link_token']
    authorization_id = data['authorization_id']

    # ── Persist the link_token ────────────────────────────────
    from django.contrib.auth.models import User
    from .models import KharchaLinkedAccount

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return django_redirect(
            f"{frontend_base}/profile?kharcha_link=failed&reason=user_not_found"
        )

    KharchaLinkedAccount.objects.update_or_create(
        user=user,
        defaults={
            'link_token':       link_token,
            'authorization_id': authorization_id,
            'is_active':        True,
        },
    )

    # Clear OAuth session keys
    request.session.pop('kharcha_oauth_state',   None)
    request.session.pop('kharcha_oauth_user_id', None)

    return django_redirect(f"{frontend_base}/profile?kharcha_link=success")


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def kharcha_link_remove(request):
    """
    DELETE /api/kharcha/link/remove/
    Unlinks the user's Kharcha account (marks is_active=False).
    """
    try:
        link = request.user.kharcha_account
        link.is_active = False
        link.save(update_fields=['is_active'])
        return Response({"success": True, "message": "Kharcha account unlinked."})
    except Exception:
        return Response({"success": False, "message": "No linked Kharcha account found."}, status=404)


# ============================================================
# SERVICE 2 — PAY WITH KHARCHA (OTP checkout)
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kharcha_pay_initiate(request):
    """
    POST /api/kharcha/pay/initiate/
    Creates an order and asks Kharcha to send an OTP to the user's
    Kharcha-registered email. Returns a payment_id that must be passed
    to /kharcha/pay/confirm/ with the OTP.

    Body:
        full_name, phone, address, city, landmark, notes  (order details)

    Requires: user has a linked Kharcha account.

    Returns:
        { order_id, payment_id, masked_email, amount }
    """
    import requests as http_requests
    from .models import KharchaLinkedAccount, Cart, Order, OrderItem

    # ── 1. Verify user has a linked account ──────────────────
    try:
        linked = request.user.kharcha_account
        if not linked.is_active:
            raise KharchaLinkedAccount.DoesNotExist
    except KharchaLinkedAccount.DoesNotExist:
        return Response(
            {
                "error": "No linked Kharcha account found. "
                         "Please link your Kharcha account first at /api/kharcha/link/start/",
                "link_url": "/api/kharcha/link/start/",
            },
            status=400,
        )

    # ── 2. Build order from cart ──────────────────────────────
    try:
        cart = Cart.objects.get(user=request.user)
        items = cart.items.all()
    except Cart.DoesNotExist:
        return Response({"error": "Cart not found."}, status=404)

    if not items.exists():
        return Response({"error": "Cart is empty."}, status=400)

    subtotal = sum(i.subtotal for i in items)
    delivery = 80
    if request.user.profile.rank_data['current_rank'] == 'Mythic Crimson':
        delivery = 0
        # Apply Rank Discount
    rank_info = request.user.profile.rank_data
    discount_amount = (subtotal * rank_info['discount']) / 100
    total = (subtotal - discount_amount) + delivery

    order = Order.objects.create(
        user=request.user,
        subtotal=subtotal,
        delivery_fee=delivery,
        rank_applied=rank_info['current_rank'],
        total=total,
        status="pending_payment",
        payment_method="kharcha",
        payment_status="pending",
        full_name=request.data.get("full_name", ""),
        phone=request.data.get("phone", ""),
        address=request.data.get("address", ""),
        city=request.data.get("city", "Kathmandu"),
        landmark=request.data.get("landmark", ""),
        notes=request.data.get("notes", ""),
    )

    for item in items:
        OrderItem.objects.create(
            order=order,
            menu_item=item.menu_item,
            quantity=item.quantity,
            price=item.menu_item.price,
        )

    # ── 3. Ask Kharcha to send OTP ────────────────────────────
    try:
        res = http_requests.post(
            f"{settings.KHARCHA_BASE_URL}/api/oauth/pay/initiate",
            headers={
                "X-Client-Id":     settings.KHARCHA_CLIENT_ID,
                "X-Client-Secret": settings.KHARCHA_CLIENT_SECRET,
                "Content-Type":    "application/json",
            },
            json={
                "link_token":   linked.link_token,
                "amount":       float(total),
                "note":         f"KTM Bites Order #{order.id}",
                "callback_url": getattr(settings, 'KHARCHA_WEBHOOK_URL', ''),
            },
            timeout=15,
        )
        data = res.json()
    except http_requests.RequestException as e:
        order.payment_status = "failed"
        order.save(update_fields=["payment_status"])
        return Response({"error": "Could not reach Kharcha.", "details": str(e)}, status=502)

    if not data.get("success"):
        order.payment_status = "failed"
        order.save(update_fields=["payment_status"])
        return Response({"error": "Kharcha declined to initiate payment.", "details": data}, status=400)

    # ── 4. Store payment_id on the order ─────────────────────
    payment_id = data["payment_id"]
    order.kharcha_payment_id = payment_id
    order.save(update_fields=["kharcha_payment_id"])

    # Clear cart
    items.delete()

    return Response({
        "success":      True,
        "order_id":     order.id,
        "payment_id":   payment_id,
        "masked_email": data.get("masked_email"),
        "amount":       float(total),
        "message":      "An OTP has been sent to your Kharcha email. "
                        "Enter it to confirm payment.",
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kharcha_pay_confirm(request):
    """
    POST /api/kharcha/pay/confirm/
    Confirms the Kharcha payment with the OTP.

    Body:
        payment_id  — returned by /kharcha/pay/initiate/
        otp         — 6-digit OTP entered by the user

    Returns:
        { success, order_id, transaction_id, amount }
    """
    import requests as http_requests
    from .models import Order

    payment_id = request.data.get("payment_id")
    otp        = request.data.get("otp")

    if not payment_id or not otp:
        return Response({"error": "payment_id and otp are required."}, status=400)

    # ── Find the order ────────────────────────────────────────
    try:
        order = Order.objects.get(
            kharcha_payment_id=payment_id,
            user=request.user,
            payment_status="pending",
        )
    except Order.DoesNotExist:
        return Response({"error": "No pending order found for this payment."}, status=404)

    # ── Confirm with Kharcha ──────────────────────────────────
    try:
        res = http_requests.post(
            f"{settings.KHARCHA_BASE_URL}/api/oauth/pay/confirm",
            headers={"Content-Type": "application/json"},
            json={"payment_id": payment_id, "otp": str(otp)},
            timeout=15,
        )
        data = res.json()
    except http_requests.RequestException as e:
        return Response({"error": "Could not reach Kharcha.", "details": str(e)}, status=502)

    if not data.get("success"):
        # Surface Kharcha's error (wrong OTP, expired, etc.)
        return Response(
            {
                "success":           False,
                "error":             data.get("message", "Payment failed."),
                "attempts_remaining": data.get("attempts_remaining"),
            },
            status=res.status_code,
        )

    # ── Mark order as paid ────────────────────────────────────
    tx = data.get("transaction", {})
    order.payment_status  = "completed"
    order.status          = "placed"
    order.transaction_id  = tx.get("transaction_id", "")
    order.save(update_fields=["payment_status", "status", "transaction_id"])

    # Notify user
    create_notification(
        order.user, 'order_placed',
        'Order Placed! 🎉',
        f'Your order #{order.order_id} has been placed successfully. We\'re getting it ready!',
        order=order,
    )

    return Response({
        "success":        True,
        "order_id":       order.id,
        "transaction_id": tx.get("transaction_id"),
        "amount":         tx.get("amount"),
        "message":        "Payment successful. Your order is confirmed.",
    })

# ============================================================
# KHARCHA — PAY PORTAL VIEWS
# ============================================================

import requests as _http_requests

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kharcha_portal_initiate(request):
    """
    POST /api/kharcha/portal/initiate/
    Creates order + Kharcha hosted-checkout session.
    Returns checkout_url for the frontend to redirect to.
    """
    from .models import Cart, Order, OrderItem

    try:
        cart = Cart.objects.get(user=request.user)
        items = cart.items.all()
    except Cart.DoesNotExist:
        return Response({"error": "Cart not found."}, status=404)

    if not items.exists():
        return Response({"error": "Cart is empty."}, status=400)

    subtotal = sum(i.subtotal for i in items)
    delivery = 80
    if request.user.profile.rank_data['current_rank'] == 'Mythic Crimson':
        delivery = 0
        # Apply Rank Discount
    rank_info = request.user.profile.rank_data
    discount_amount = (subtotal * rank_info['discount']) / 100
    total = (subtotal - discount_amount) + delivery

    order = Order.objects.create(
        user=request.user,
        subtotal=subtotal,
        delivery_fee=delivery,
        rank_applied=rank_info['current_rank'],
        total=total,
        status="pending_payment",
        payment_method="kharcha",
        payment_status="pending",
        full_name=request.data.get("full_name", ""),
        phone=request.data.get("phone", ""),
        address=request.data.get("address", ""),
        city=request.data.get("city", "Kathmandu"),
        landmark=request.data.get("landmark", ""),
        notes=request.data.get("notes", ""),
    )

    for item in items:
        OrderItem.objects.create(
            order=order,
            menu_item=item.menu_item,
            quantity=item.quantity,
            price=item.menu_item.price,
        )

    backend_base  = getattr(settings, 'BACKEND_BASE_URL', 'http://localhost:8000')
    return_url    = f"{backend_base}/api/kharcha/portal/callback/"
    callback_url  = getattr(settings, 'KHARCHA_WEBHOOK_URL', '')

    try:
        res = _http_requests.post(
            f"{settings.KHARCHA_BASE_URL}/api/pay-portal/sessions/create",
            headers={
                "X-API-Key":    settings.KHARCHA_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "amount":       float(total),
                "note":         f"KTM Bites Order #{order.id}",
                "return_url":   return_url,
                "callback_url": callback_url,
            },
            timeout=15,
        )
        data = res.json()
    except Exception as e:
        order.payment_status = "failed"
        order.save(update_fields=["payment_status"])
        return Response({"error": "Could not reach Kharcha.", "details": str(e)}, status=502)

    if not data.get("success"):
        order.payment_status = "failed"
        order.save(update_fields=["payment_status"])
        return Response({"error": "Kharcha declined to create session.", "details": data}, status=400)

    session_id   = data["session_id"]
    checkout_url = data["checkout_url"]

    order.kharcha_payment_id = session_id
    order.save(update_fields=["kharcha_payment_id"])

    items.delete()

    return Response({
        "success":      True,
        "order_id":     order.id,
        "session_id":   session_id,
        "checkout_url": checkout_url,
        "amount":       float(total),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def kharcha_portal_callback(request):
    """
    GET /api/kharcha/portal/callback/
    Kharcha redirects here after the user pays or cancels.
    Marks order paid/failed and redirects to the frontend.
    """
    from .models import Order

    frontend_base  = settings.FRONTEND_BASE_URL
    status         = request.GET.get('status')
    transaction_id = request.GET.get('transaction_id', '')
    session_id     = request.GET.get('session_id', '')

    if not session_id:
        return django_redirect(f"{frontend_base}/checkout?kharcha_error=missing_session")

    try:
        order = Order.objects.get(kharcha_payment_id=session_id, payment_status="pending")
    except Order.DoesNotExist:
        return django_redirect(f"{frontend_base}/checkout?kharcha_error=order_not_found")

    if status == "success":
        order.payment_status = "completed"
        order.status = "placed"
        order.transaction_id = transaction_id
        order.save(update_fields=["payment_status", "status", "transaction_id"])

        # Notify user
        create_notification(
            order.user, 'order_placed',
            'Order Placed! 🎉',
            f'Your order #{order.order_id} has been placed successfully. We\'re getting it ready!',
            order=order,
        )

        return django_redirect(f"{frontend_base}/order-tracking/{order.id}")

    order.payment_status = "failed"
    order.save(update_fields=["payment_status"])
    return django_redirect(f"{frontend_base}/checkout?cancelled=1&orderId={order.id}")


# ════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ════════════════════════════════════════════════════════════════

def create_notification(user, notif_type, title, message, order=None):
    """Helper to create a notification for a user."""
    Notification.objects.create(
        user=user,
        type=notif_type,
        title=title,
        message=message,
        order=order,
    )


DAILY_REMINDERS = [
    {"title": "Hungry? 🍕", "message": "It's been a while! Treat yourself to something delicious from KTM Bites today."},
    {"title": "Craving something? 🔥", "message": "Our chefs are ready! Browse the menu and discover today's specials."},
    {"title": "Lunchtime deal! 🎉", "message": "Don't miss out — fresh momos, burgers, and more are just a tap away."},
    {"title": "Your favorites miss you 💛", "message": "Come back and enjoy your top-rated picks with free delivery vibes."},
    {"title": "New items alert! 🆕", "message": "We've got fresh additions to the menu. Come see what's cooking!"},
    {"title": "Fuel your day! ☕", "message": "A great meal makes a great day. Order now and taste the difference."},
    {"title": "Weekend treat 🎊", "message": "You deserve a break! Explore our curated picks for the perfect weekend bite."},
]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """List user notifications (last 30). Auto-generates a daily reminder if none exists today."""
    user = request.user
    today = timezone.now().date()

    # Auto-generate daily reminder if user hasn't received one today
    has_today_reminder = Notification.objects.filter(
        user=user, type='reminder', created_at__date=today
    ).exists()

    if not has_today_reminder:
        import random
        reminder = random.choice(DAILY_REMINDERS)
        create_notification(user, 'reminder', reminder['title'], reminder['message'])

    notifications = Notification.objects.filter(user=user)[:30]
    serializer = NotificationSerializer(notifications, many=True)
    unread_count = Notification.objects.filter(user=user, is_read=False).count()

    return Response({
        'notifications': serializer.data,
        'unread_count': unread_count,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, pk):
    """Mark a single notification as read."""
    try:
        notif = Notification.objects.get(pk=pk, user=request.user)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'status': 'ok'})
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read(request):
    """Mark all notifications as read."""
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'ok'})
