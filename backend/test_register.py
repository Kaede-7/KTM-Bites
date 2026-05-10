import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from api.serializers import RegisterSerializer

data = {
    'email': 'new_rider@ktmbites.com',
    'password': 'password123',
    'full_name': 'New Rider',
    'role': 'RIDER'
}

serializer = RegisterSerializer(data=data)
if serializer.is_valid():
    user = serializer.save()
    print("User created:", user.email)
    print("User is_staff:", user.is_staff)
    if hasattr(user, 'profile'):
        print("Profile role:", user.profile.role)
else:
    print("Errors:", serializer.errors)
