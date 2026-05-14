
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.contrib.auth.models import User

email = 'sakshamrajkarnikar4@gmail.com'
try:
    user = User.objects.get(email=email)
    print(f"ID: {user.id}")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"First Name: '{user.first_name}'")
    print(f"Last Name: '{user.last_name}'")
    if hasattr(user, 'profile'):
        print(f"Role: {user.profile.role}")
except User.DoesNotExist:
    print("User not found")
