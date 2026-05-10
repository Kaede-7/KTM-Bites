import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

user = User.objects.create(username='test_hasattr_user')
# The signal manage_user_profiles might have created a profile!
# Let's delete the profile.
if hasattr(user, 'profile'):
    user.profile.delete()
    print("Deleted auto-created profile.")

# Now try hasattr
try:
    print("hasattr(user, 'profile'):", hasattr(user, 'profile'))
except Exception as e:
    print("Exception:", e)

user.delete()
