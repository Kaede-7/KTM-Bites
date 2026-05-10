import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, RiderProfile

try:
    u = User.objects.get(email='rider@ktmbites.com')
    print(f"User found: {u.username}, is_staff={u.is_staff}")
    if hasattr(u, 'profile'):
        print(f"UserProfile role: {u.profile.role}")
    else:
        print("No UserProfile")

    if hasattr(u, 'rider_profile'):
        print("Has rider_profile")
    else:
        print("No rider_profile")

except User.DoesNotExist:
    print("rider@ktmbites.com not found")
