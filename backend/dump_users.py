import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.contrib.auth.models import User

users = User.objects.all()
print(f"Total Users: {users.count()}")
for u in users:
    role = "NO PROFILE"
    if hasattr(u, 'profile'):
        try:
            role = u.profile.role
        except Exception:
            role = "EXCEPTION"
    print(f"- {u.email} (staff={u.is_staff}): {role}")
