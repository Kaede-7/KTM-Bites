from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import (
    Category, MenuItem, Cart, CartItem, Order, OrderItem, PasswordResetToken,
    RiderProfile, Notification, GroupOrder, GroupOrderMember, GroupCartItem,
    GroupPaymentShare,
)


# ───── Auth Serializers ─────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(source='first_name')
    phone = serializers.CharField(write_only=True, required=False, default='')
    calorie_target = serializers.IntegerField(write_only=True, min_value=500, max_value=10000, required=False, allow_null=True, default=None)

    role = serializers.CharField(write_only=True, required=False, default='USER')

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'calorie_target', 'password', 'role']

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(not char.isalnum() for char in value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists() or User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        from .models import RiderProfile
        phone = validated_data.pop('phone', '')
        calorie_target = validated_data.pop('calorie_target', None)
        role = validated_data.pop('role', 'USER')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
        )
        # Store phone and role in UserProfile
        user.profile.phone = phone
        user.profile.role = role
        user.profile.calorie_target = calorie_target
        user.profile.save()


        user.save()
        return user


class RiderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiderProfile
        fields = [
            'id', 'full_name', 'email', 'username', 'phone', 
            'vehicle_type', 'license_number', 'is_available', 
            'last_login', 'rating', 'rating_count'
        ]
        read_only_fields = ['last_login']


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='first_name')
    role = serializers.CharField(source='profile.role', read_only=True)
    phone = serializers.CharField(source='profile.phone', default='')
    address = serializers.CharField(source='profile.address', default='')
    city = serializers.CharField(source='profile.city', default='')
    bio = serializers.CharField(source='profile.bio', default='')
    calorie_target = serializers.IntegerField(source='profile.calorie_target', min_value=500, max_value=10000, allow_null=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'phone', 'address', 'city', 'bio', 'calorie_target']


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password endpoint."""
    email = serializers.EmailField()

    def validate_email(self, value):
        """Validate that email format is correct (but do NOT check if user exists - prevent enumeration)."""
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for password reset endpoint."""
    token = serializers.CharField(max_length=255)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        """Validate new password strength (basic validation)."""
        if not any(char.isalpha() for char in value):
            raise ValidationError("Password must contain at least one letter.")
        if not any(char.isdigit() for char in value):
            raise ValidationError("Password must contain at least one digit.")
        return value


# ───── Menu Serializers ─────

class CategorySerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'count']

    def get_count(self, obj):
        return obj.items.filter(is_available=True).count()


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'category', 'category_name', 'price', 'old_price',
            'rating', 'reviews', 'time', 'image', 'description',
            'calories', 'badge', 'is_available',
        ]


class MenuItemDetailSerializer(MenuItemSerializer):
    """Extended serializer with related items."""
    related = serializers.SerializerMethodField()

    class Meta(MenuItemSerializer.Meta):
        fields = MenuItemSerializer.Meta.fields + ['related']

    def get_related(self, obj):
        related_items = MenuItem.objects.filter(
            category=obj.category, is_available=True
        ).exclude(id=obj.id)[:3]
        return MenuItemSerializer(related_items, many=True).data


# ───── Cart Serializers ─────

class CartItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    name = serializers.CharField(source='menu_item.name', read_only=True)
    category = serializers.CharField(source='menu_item.category.name', read_only=True)
    price = serializers.DecimalField(source='menu_item.price', max_digits=8, decimal_places=2, read_only=True)
    image = serializers.URLField(source='menu_item.image', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    calories = serializers.IntegerField(source='menu_item.calories', read_only=True)
    total_calories = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'menu_item', 'name', 'category', 'price', 'quantity', 'image', 'subtotal', 'calories', 'total_calories']
        extra_kwargs = {'menu_item': {'write_only': True}}


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    total_calories = serializers.IntegerField(read_only=True)
    calorie_target = serializers.SerializerMethodField()
    calorie_percentage = serializers.SerializerMethodField()
    calorie_exceeded = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            'id', 'items', 'total', 'item_count', 'total_calories',
            'calorie_target', 'calorie_percentage', 'calorie_exceeded',
        ]

    def get_calorie_target(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.calorie_target is not None:
            return profile.calorie_target
        return None

    def get_calorie_percentage(self, obj):
        target = self.get_calorie_target(obj)
        return round((obj.total_calories / target) * 100, 1) if target else 0

    def get_calorie_exceeded(self, obj):
        target = self.get_calorie_target(obj)
        return obj.total_calories > target if target is not None else False



class GroupMemberSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    calorie_target = serializers.IntegerField(source='user.profile.calorie_target', read_only=True)
    kharcha_linked = serializers.SerializerMethodField()

    class Meta:
        model = GroupOrderMember
        fields = ['id', 'user', 'name', 'email', 'calorie_target', 'kharcha_linked', 'joined_at']

    def get_name(self, obj):
        return obj.user.first_name or obj.user.email.split('@')[0]

    def get_kharcha_linked(self, obj):
        return bool(
            hasattr(obj.user, 'kharcha_account') and
            obj.user.kharcha_account.is_active
        )


class GroupCartItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='menu_item.name', read_only=True)
    image = serializers.URLField(source='menu_item.image', read_only=True)
    price = serializers.DecimalField(source='menu_item.price', max_digits=8, decimal_places=2, read_only=True)
    calories = serializers.IntegerField(source='menu_item.calories', read_only=True)
    owner_name = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_calories = serializers.IntegerField(read_only=True)

    class Meta:
        model = GroupCartItem
        fields = [
            'id', 'menu_item', 'name', 'image', 'price', 'calories', 'quantity',
            'added_by', 'owner_name', 'subtotal', 'total_calories',
        ]

    def get_owner_name(self, obj):
        return obj.added_by.first_name or obj.added_by.email.split('@')[0]


class GroupPaymentShareSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    is_current_user = serializers.SerializerMethodField()
    paid_by_name = serializers.SerializerMethodField()
    payment_payer_name = serializers.SerializerMethodField()

    class Meta:
        model = GroupPaymentShare
        fields = [
            'id', 'user', 'name', 'amount', 'status', 'transaction_id',
            'is_current_user', 'paid_by', 'paid_by_name', 'payment_payer',
            'payment_payer_name',
        ]

    def get_name(self, obj):
        return obj.user.first_name or obj.user.email.split('@')[0]

    def get_is_current_user(self, obj):
        request = self.context.get('request')
        return bool(request and request.user == obj.user)

    def get_paid_by_name(self, obj):
        if not obj.paid_by:
            return None
        return obj.paid_by.first_name or obj.paid_by.email.split('@')[0]

    def get_payment_payer_name(self, obj):
        if not obj.payment_payer:
            return None
        return obj.payment_payer.first_name or obj.payment_payer.email.split('@')[0]


class GroupOrderSerializer(serializers.ModelSerializer):
    members = GroupMemberSerializer(many=True, read_only=True)
    items = GroupCartItemSerializer(many=True, read_only=True)
    payment_shares = GroupPaymentShareSerializer(many=True, read_only=True)
    host_name = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    delivery_fee = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_calories = serializers.IntegerField(read_only=True)
    calorie_target = serializers.IntegerField(read_only=True)
    calorie_percentage = serializers.SerializerMethodField()
    is_host = serializers.SerializerMethodField()

    class Meta:
        model = GroupOrder
        fields = [
            'id', 'name', 'invite_code', 'status', 'split_mode', 'host',
            'single_payment_mode', 'kharcha_group_id', 'kharcha_sync_status',
            'kharcha_missing_members',
            'host_name', 'is_host', 'members', 'items', 'payment_shares',
            'subtotal', 'delivery_fee', 'total', 'total_calories',
            'calorie_target', 'calorie_percentage', 'full_name', 'phone',
            'address', 'city', 'landmark', 'notes', 'order', 'created_at',
        ]

    def get_host_name(self, obj):
        return obj.host.first_name or obj.host.email.split('@')[0]

    def get_calorie_percentage(self, obj):
        return round((obj.total_calories / obj.calorie_target) * 100, 1) if obj.calorie_target else 0

    def get_is_host(self, obj):
        request = self.context.get('request')
        return bool(request and request.user == obj.host)


class AddToCartSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1, min_value=1)
    allow_over_limit = serializers.BooleanField(default=False)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
    allow_over_limit = serializers.BooleanField(default=False)


# ───── Order Serializers ─────

class OrderItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='menu_item.name', read_only=True)
    image = serializers.URLField(source='menu_item.image', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'quantity', 'price', 'image', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    order_id = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    rider_location = serializers.SerializerMethodField()
    rider_info = serializers.SerializerMethodField()
    has_reviewed_rider = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'rider', 'status', 'status_display',
            'payment_method', 'payment_status', 'pidx', 'transaction_id',
            'full_name', 'phone', 'address',
            'city', 'landmark', 'notes', 'subtotal', 'delivery_fee',
            'discount_amount', 'rank_applied',
            'total', 'items', 'created_at', 'rider_location', 'rider_info',
            'has_reviewed_rider',
            'can_manage',
        ]
        read_only_fields = ['subtotal', 'delivery_fee', 'discount_amount', 'rank_applied', 'total', 'status', 'payment_status', 'pidx', 'transaction_id', 'rider']

    def get_rider_location(self, obj):
        """Return rider's live GPS coordinates if available."""
        if obj.rider:
            if obj.rider.current_lat and obj.rider.current_lng:
                return {'lat': obj.rider.current_lat, 'lng': obj.rider.current_lng}
        return None

    def get_rider_info(self, obj):
        """Return rider's name and phone for the driver card."""
        if obj.rider:
            return {
                'id': obj.rider.id,
                'name': obj.rider.full_name,
                'phone': obj.rider.phone,
                'vehicle_type': obj.rider.vehicle_type,
                'rating': float(obj.rider.rating),
                'rating_count': obj.rider.rating_count
            }
        return None

    def get_has_reviewed_rider(self, obj):
        from .models import RiderReview
        if obj.rider and obj.user:
            return RiderReview.objects.filter(order=obj, user=obj.user).exists()
        return False

    def get_can_manage(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.id == obj.user_id)


class PlaceOrderSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=50, default='Kathmandu')
    landmark = serializers.CharField(max_length=100, required=False, default='')
    notes = serializers.CharField(required=False, default='')
    payment_method = serializers.ChoiceField(choices=['khalti', 'kharcha'])


# ───── Notification Serializers ─────

class NotificationSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True, default=None)

    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'order_id', 'is_read', 'created_at']
        read_only_fields = ['id', 'type', 'title', 'message', 'order_id', 'created_at']
