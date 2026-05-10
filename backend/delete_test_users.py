import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.contrib.auth.models import User

emails_to_delete = [
    'rider@ktmbites.com',
    'admin@123gmail.com',
    'kitchen@ktmbites.com',
    'admin@ktmbites.com'
]

for email in emails_to_delete:
    try:
        user = User.objects.get(email=email)
        username = user.username
        user.delete()
        print(f"Deleted user: {email} (username: {username})")
    except User.DoesNotExist:
        print(f"User not found: {email}")
    except Exception as e:
        print(f"Error deleting {email}: {e}")
