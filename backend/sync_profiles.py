import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import AdminProfile, KitchenProfile, RiderProfile

def sync_profiles():
    print("Syncing login info to profile tables...")
    
    # Sync Admin Profiles
    admins = AdminProfile.objects.all()
    for admin in admins:
        admin.email = admin.user.email
        admin.username = admin.user.username
        admin.save()
        print(f"  Synced Admin: {admin.username}")

    # Sync Kitchen Profiles
    kitchens = KitchenProfile.objects.all()
    for kitchen in kitchens:
        kitchen.email = kitchen.user.email
        kitchen.username = kitchen.user.username
        kitchen.save()
        print(f"  Synced Kitchen: {kitchen.username}")

    # Sync Rider Profiles
    riders = RiderProfile.objects.all()
    for rider in riders:
        rider.email = rider.user.email
        rider.username = rider.user.username
        rider.save()
        print(f"  Synced Rider: {rider.username}")

    print("Sync complete!")

if __name__ == "__main__":
    sync_profiles()
