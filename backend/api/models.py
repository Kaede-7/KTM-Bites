from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    icon = models.CharField(max_length=50, default='restaurant')

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    old_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0.0)
    reviews = models.IntegerField(default=0)
    time = models.CharField(max_length=20, default='20-25 min')
    image = models.URLField(max_length=500)
    description = models.TextField(blank=True)
    badge = models.CharField(max_length=20, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-rating']

    def __str__(self):
        return self.name


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'menu_item')

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name}"

    @property
    def subtotal(self):
        return self.menu_item.price * self.quantity


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('placed', 'Order Placed'),
        ('preparing', 'Preparing'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('on_way', 'On the Way'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_CHOICES = [
        ('khalti', 'Khalti'),
        ('kharcha', 'Kharcha'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    rider = models.ForeignKey('RiderProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='placed')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='khalti')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=50, default='Kathmandu')
    landmark = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=80)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rank_applied = models.CharField(max_length=50, blank=True, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    pidx = models.CharField(max_length=255, null=True, blank=True)
    transaction_id = models.CharField(max_length=255, null=True, blank=True)
    kharcha_payment_id  = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"

    @property
    def order_id(self):
        return f"KTM-2024-{str(self.id).zfill(3)}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name}"

    @property
    def subtotal(self):
        return self.price * self.quantity


class Role(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    USER = 'USER', 'User'
    KITCHEN = 'KITCHEN', 'Kitchen'
    RIDER = 'RIDER', 'Rider'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    address = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='Kathmandu')
    bio = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def rank_data(self):
        order_count = self.user.orders.filter(payment_status='completed').count()
        
        ranks = [
            {'name': 'Rookie', 'min': 0, 'max': 1, 'discount': 0, 'color': '#8b7d72'},
            {'name': 'Bronze', 'min': 2, 'max': 5, 'discount': 2, 'color': '#cd7f32'},
            {'name': 'Silver', 'min': 6, 'max': 15, 'discount': 4, 'color': '#c0c0c0'},
            {'name': 'Gold', 'min': 16, 'max': 30, 'discount': 6, 'color': '#ffd700'},
            {'name': 'Platinum', 'min': 31, 'max': 50, 'discount': 8, 'color': '#e2f0ff'},
            {'name': 'Diamond', 'min': 51, 'max': 499, 'discount': 10, 'color': '#b9f2ff'},
            {'name': 'Mythic Crimson', 'min': 500, 'max': 99999, 'discount': 25, 'color': '#8b0000'},
        ]
        
        current_rank = ranks[0]
        next_rank = ranks[1] if len(ranks) > 1 else None
        
        for i, r in enumerate(ranks):
            if order_count >= r['min']:
                current_rank = r
                if i + 1 < len(ranks):
                    next_rank = ranks[i+1]
                else:
                    next_rank = None
        
        progress = 0
        if next_rank:
            range_total = next_rank['min'] - current_rank['min']
            range_current = order_count - current_rank['min']
            progress = min(100, (range_current / range_total) * 100)
        else:
            progress = 100

        return {
            'order_count': order_count,
            'current_rank': current_rank['name'],
            'discount': current_rank['discount'],
            'color': current_rank['color'],
            'next_rank': next_rank['name'] if next_rank else 'Max',
            'progress': round(progress, 1),
            'orders_to_next': (next_rank['min'] - order_count) if next_rank else 0
        }


class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    email = models.EmailField(max_length=255, blank=True)
    username = models.CharField(max_length=150, blank=True)
    employee_id = models.CharField(max_length=50, blank=True)
    department = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Admin: {self.username or self.user.username}"


class KitchenProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kitchen_profile')
    email = models.EmailField(max_length=255, blank=True)
    username = models.CharField(max_length=150, blank=True)
    restaurant_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_open = models.BooleanField(default=True)
    location_lat = models.FloatField(null=True, blank=True)
    location_lng = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Kitchen: {self.restaurant_name}"


class RiderProfile(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255) # We will store hashed passwords here
    phone = models.CharField(max_length=20, blank=True, default='')
    vehicle_type = models.CharField(max_length=50, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    is_available = models.BooleanField(default=True)
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    last_login = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rider: {self.full_name} ({self.email})"


class PasswordResetToken(models.Model):
    """
    Model to store password reset tokens with expiration.
    Tokens are single-use and expire after 15 minutes.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Reset token for {self.user.email} (expires: {self.expires_at})"

    def is_valid(self):
        """Check if token exists and has not expired."""
        from django.utils import timezone
        return timezone.now() <= self.expires_at

class KharchaLinkedAccount(models.Model):
    """
    Stores the Kharcha OAuth link_token for a user who has
    authorised KTM-Bites to charge their Kharcha wallet.
 
    One user → one linked account (OneToOneField enforces this).
    The link_token is long-lived — treat it like a password.
    """
    user           = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='kharcha_account',
    )
    link_token      = models.CharField(max_length=512)       # kh_link_…
    authorization_id = models.CharField(max_length=255)
    linked_at       = models.DateTimeField(auto_now_add=True)
    is_active       = models.BooleanField(default=True)
 
    class Meta:
        verbose_name = 'Kharcha Linked Account'
 
    def __str__(self):
        return f"Kharcha link for {self.user.username}"

class Notification(models.Model):
    """User notifications for order updates, promos, and reminders."""
    TYPE_CHOICES = [
        ('order_placed', 'Order Placed'),
        ('order_preparing', 'Preparing'),
        ('order_ready', 'Ready for Pickup'),
        ('order_on_way', 'On the Way'),
        ('order_delivered', 'Delivered'),
        ('order_cancelled', 'Order Cancelled'),
        ('promo', 'Promotion'),
        ('reminder', 'Reminder'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=200)
    message = models.TextField()
    order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type}: {self.title} → {self.user.username}"


# Auto-create/save profiles when a User is created
@receiver(post_save, sender=User)
def manage_user_profiles(sender, instance, created, **kwargs):
    """
    Creates a UserProfile for every new user.
    Specific profiles (Admin, Kitchen, Rider) should be created 
    manually or when the role is updated.
    """
    if created:
        UserProfile.objects.create(user=instance)
    
    # Save the base profile
    if hasattr(instance, 'profile'):
        instance.profile.save()
    
    # Save specific profiles and sync info if they exist
    if hasattr(instance, 'admin_profile'):
        instance.admin_profile.email = instance.email
        instance.admin_profile.username = instance.username
        instance.admin_profile.save()
    if hasattr(instance, 'kitchen_profile'):
        instance.kitchen_profile.email = instance.email
        instance.kitchen_profile.username = instance.username
        instance.kitchen_profile.save()


