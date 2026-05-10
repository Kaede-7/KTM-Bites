import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

rider = User.objects.get(email='new_rider@ktmbites.com')
token, _ = Token.objects.get_or_create(user=rider)

client = Client()
response = client.get('/api/admin/orders/', HTTP_AUTHORIZATION=f'Token {token.key}')
print("Status Code:", response.status_code)
if response.status_code != 200:
    print(response.content)
