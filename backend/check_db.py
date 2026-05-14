import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import PasswordResetToken

def check_db():
    print("--- Recent Users ---")
    users = User.objects.all().order_by('-id')[:10]
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}")
    
    print("\n--- Recent Password Reset Tokens ---")
    tokens = PasswordResetToken.objects.all().order_by('-created_at')[:10]
    for t in tokens:
        print(f"User: {t.user.email}, Created: {t.created_at}, Token: {t.token[:10]}...")

if __name__ == "__main__":
    check_db()
