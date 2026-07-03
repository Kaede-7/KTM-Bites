from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import (
    Category, MenuItem, Cart, UserProfile, Role,
    AdminProfile, KitchenProfile, RiderProfile
)
import os


class Command(BaseCommand):
    help = 'Seed the database with sample menu and user data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # ── Categories ──
        categories_data = [
            {'name': 'Momo', 'icon': 'ramen_dining'},
            {'name': 'Pizza', 'icon': 'local_pizza'},
            {'name': 'Burger', 'icon': 'lunch_dining'},
            {'name': 'Nepali', 'icon': 'restaurant'},
            {'name': 'Drinks', 'icon': 'local_cafe'},
            {'name': 'Desserts', 'icon': 'cake'},
        ]

        cats = {}
        for cat_data in categories_data:
            cat, _ = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'icon': cat_data['icon']}
            )
            cats[cat.name] = cat
            self.stdout.write(f'  Category: {cat.name}')

        # ── Menu Items ──
        items_data = [
            {
                'name': 'Chicken Steam Momo',
                'category': 'Momo',
                'price': 220,
                'old_price': 280,
                'rating': 4.8,
                'reviews': 128,
                'time': '20-25 min',
                'image': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=500&fit=crop',
                'description': 'Our signature chicken momos are filled with a savory blend of minced chicken, ginger, garlic, and fresh herbs. Steamed to perfection and served with our house-made spicy tomato achar. A Kathmandu street-food classic!',
                'calories': 420,
                'badge': 'Bestseller',
            },
            {
                'name': 'Buff Momo (Fried)',
                'category': 'Momo',
                'price': 250,
                'rating': 4.7,
                'reviews': 95,
                'time': '20-25 min',
                'image': 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&h=500&fit=crop',
                'description': 'Crispy fried buff momos served with tangy tomato achar. Golden and crunchy on the outside, juicy on the inside.',
                'calories': 560,
                'badge': '',
            },
            {
                'name': 'Margherita Pizza',
                'category': 'Pizza',
                'price': 650,
                'rating': 4.6,
                'reviews': 85,
                'time': '25-30 min',
                'image': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=500&fit=crop',
                'description': 'Authentic Italian-style pizza with San Marzano tomato sauce, fresh mozzarella, and fragrant basil on a crispy thin crust.',
                'calories': 780,
                'badge': '',
            },
            {
                'name': 'Pepperoni Pizza',
                'category': 'Pizza',
                'price': 750,
                'rating': 4.8,
                'reviews': 72,
                'time': '25-30 min',
                'image': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=500&fit=crop',
                'description': 'Loaded with pepperoni, mozzarella and oregano on our signature hand-tossed dough.',
                'calories': 920,
                'badge': 'New',
            },
            {
                'name': 'Classic Burger',
                'category': 'Burger',
                'price': 380,
                'rating': 4.5,
                'reviews': 64,
                'time': '15-20 min',
                'image': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=500&fit=crop',
                'description': 'A juicy beef patty topped with cheddar cheese, fresh lettuce, tomato, onion rings, and our special house sauce.',
                'calories': 650,
                'badge': '',
            },
            {
                'name': 'Thakali Set',
                'category': 'Nepali',
                'price': 450,
                'rating': 4.9,
                'reviews': 210,
                'time': '20-25 min',
                'image': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=500&fit=crop',
                'description': 'Traditional Nepali dal bhat set with steamed rice, lentil soup, seasonal vegetable curries, pickles, and papadum.',
                'calories': 850,
                'badge': 'Popular',
            },
            {
                'name': 'Chicken Chowmein',
                'category': 'Nepali',
                'price': 200,
                'rating': 4.4,
                'reviews': 56,
                'time': '15-20 min',
                'image': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=500&fit=crop',
                'description': 'Stir-fried noodles with chicken and fresh vegetables, seasoned with soy sauce and spices.',
                'calories': 610,
                'badge': '',
            },
            {
                'name': 'Iced Latte',
                'category': 'Drinks',
                'price': 180,
                'rating': 4.3,
                'reviews': 42,
                'time': '5-10 min',
                'image': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=500&fit=crop',
                'description': 'Double-shot espresso blended with cold milk, served over ice. Smooth and refreshing.',
                'calories': 180,
                'badge': '',
            },
            {
                'name': 'Chocolate Brownie',
                'category': 'Desserts',
                'price': 250,
                'rating': 4.7,
                'reviews': 38,
                'time': '10-15 min',
                'image': 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&h=500&fit=crop',
                'description': 'Rich and fudgy chocolate brownie with walnuts, served warm with a scoop of vanilla ice cream.',
                'calories': 520,
                'badge': '',
            },
        ]

        for item_data in items_data:
            cat_name = item_data.pop('category')
            MenuItem.objects.get_or_create(
                name=item_data['name'],
                defaults={**item_data, 'category': cats[cat_name]}
            )
            self.stdout.write(f'  Menu Item: {item_data["name"]}')

        # ── Demo Customer ──
        demo_email = os.environ.get('DEMO_USER_EMAIL', 'saksham@email.com')
        demo_password = os.environ.get('DEMO_USER_PASSWORD', 'password123')
        demo_user, created = User.objects.get_or_create(
            username=demo_email,
            defaults={
                'email': demo_email,
                'first_name': 'Saksham Shrestha',
                'last_name': '+977-9812345678',
            }
        )
        if created:
            demo_user.set_password(demo_password)
            demo_user.save()
            self.stdout.write(f'  Demo customer created: {demo_email}')
        Token.objects.get_or_create(user=demo_user)
        Cart.objects.get_or_create(user=demo_user)

        # Update UserProfile for demo customer
        profile, _ = UserProfile.objects.get_or_create(user=demo_user)
        profile.role = Role.USER
        profile.address = 'Thamel, Kathmandu'
        profile.city = 'Kathmandu'
        profile.bio = 'Food lover based in Kathmandu 🍕'
        profile.save()
        self.stdout.write('  Demo customer profile updated')

        # ── Admin User ──
        admin_email = os.environ.get('ADMIN_USER_EMAIL', 'admin@ktmbites.com')
        admin_password = os.environ.get('ADMIN_USER_PASSWORD', 'admin123')
        admin_user, created = User.objects.get_or_create(
            username=admin_email,
            defaults={
                'email': admin_email,
                'first_name': 'System Admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password(admin_password)
            admin_user.save()
            self.stdout.write(f'  Admin user created: {admin_email}')

        # Update Admin Profile
        profile, _ = UserProfile.objects.get_or_create(user=admin_user)
        profile.role = Role.ADMIN
        profile.save()
        AdminProfile.objects.get_or_create(
            user=admin_user,
            defaults={'employee_id': 'KTM-ADMIN-001', 'department': 'Management'}
        )
        self.stdout.write('  Admin profile details added')

        # ── Kitchen Staff ──
        kitchen_email = os.environ.get('KITCHEN_USER_EMAIL', 'kitchen@ktmbites.com')
        kitchen_password = os.environ.get('KITCHEN_USER_PASSWORD', 'kitchen123')
        kitchen_user, created = User.objects.get_or_create(
            username=kitchen_email,
            defaults={
                'email': kitchen_email,
                'first_name': 'Main Kitchen',
                'is_staff': True,
            }
        )
        if created:
            kitchen_user.set_password(kitchen_password)
            kitchen_user.save()
            self.stdout.write(f'  Kitchen user created: {kitchen_email}')

        # Update Kitchen Profile
        profile, _ = UserProfile.objects.get_or_create(user=kitchen_user)
        profile.role = Role.KITCHEN
        profile.save()
        KitchenProfile.objects.get_or_create(
            user=kitchen_user,
            defaults={
                'restaurant_name': 'KTM Bites Central Kitchen',
                'description': 'Main branch providing high-quality food across Kathmandu.',
                'location_lat': 27.7172,
                'location_lng': 85.3240
            }
        )
        self.stdout.write('  Kitchen profile details added')

        # ── Rider Staff ──
        rider_email = os.environ.get('RIDER_USER_EMAIL', 'rider@ktmbites.com')
        rider_password = os.environ.get('RIDER_USER_PASSWORD', 'rider123')
        
        from django.contrib.auth.hashers import make_password
        RiderProfile.objects.get_or_create(
            email=rider_email,
            defaults={
                'username': 'rider_express',
                'full_name': 'Express Rider',
                'password': make_password(rider_password),
                'vehicle_type': 'Motorcycle',
                'license_number': 'BA-PA-1234',
                'is_available': True,
                'phone': '+977-9800000000'
            }
        )
        self.stdout.write('  Rider profile created independently')

        self.stdout.write(self.style.SUCCESS('Database seeded successfully with roles and profile info!'))
