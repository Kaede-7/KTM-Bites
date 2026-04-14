#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

u = User.objects.get(username='admin@ktmbites.com')
tokens = Token.objects.filter(user=u)
print(f'Admin Tokens: {tokens.count()}')
for t in tokens:
    print(f'Token: {t.key}')

if tokens.count() == 0:
    print('No tokens found! Creating one...')
    token = Token.objects.create(user=u)
    print(f'Created token: {token.key}')
