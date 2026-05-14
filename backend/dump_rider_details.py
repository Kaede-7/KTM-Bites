
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from api.models import RiderProfile

email = 'sakshamrajkarnikar4@gmail.com'
try:
    rider = RiderProfile.objects.get(email=email)
    print(f"ID: {rider.id}")
    print(f"Full Name: '{rider.full_name}'")
    print(f"Email: {rider.email}")
except RiderProfile.DoesNotExist:
    print("RiderProfile not found")
