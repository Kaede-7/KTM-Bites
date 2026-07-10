"""
fix_kitchen_role.py
====================
Diagnoses and fixes the "Access denied. Kitchen staff credentials required."
error on the Kitchen portal login.

ROOT CAUSE:
Kitchen.tsx accepts a login only if the backend returns user.role == "KITCHEN"
(see frontend/src/pages/Kitchen.tsx handleLogin, and views.py login_view).
That role lives on the api_userprofile.role column, NOT on auth_user. If that
row is missing, or was created with the default role ("USER") instead of
"KITCHEN" -- e.g. the account got created by something other than
`manage.py seed_data` (self-registration, a manual DB insert, an admin-panel
user-add flow, etc.) -- then the email/password check in login_view passes
fine (200 OK, valid token issued), but the role check on the frontend still
rejects it. That exactly matches "access denied" even though the typed
credentials are correct: authentication succeeded, authorization didn't.

This script is idempotent and safe to run repeatedly. Run it from the
backend/ directory with your venv active (same env check_db.py uses --
it reads DATABASE_URL from .env automatically):

    python fix_kitchen_role.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, KitchenProfile, Role

KITCHEN_EMAIL = os.environ.get('KITCHEN_USER_EMAIL', 'kitchen@ktmbites.com')


def main():
    print(f"Looking up kitchen account: {KITCHEN_EMAIL}")

    # username is set == email at creation time (see seed_data.py / register flow)
    user = User.objects.filter(username=KITCHEN_EMAIL).first() or User.objects.filter(email=KITCHEN_EMAIL).first()

    if user is None:
        print(f"\nNo auth_user row found for '{KITCHEN_EMAIL}' at all.")
        print("The account has never been created. Fix: run `python manage.py seed_data`.")
        return

    print(f"  auth_user.id       = {user.id}")
    print(f"  auth_user.username = {user.username}")
    print(f"  auth_user.email    = {user.email}")
    print(f"  auth_user.is_active= {user.is_active}")
    print(f"  auth_user.is_staff = {user.is_staff}")

    if not user.is_active:
        print("\n  -> BUG: is_active is False. Django's authenticate() will silently reject this login. Fixing.")
        user.is_active = True
        user.save()

    profile = UserProfile.objects.filter(user=user).first()

    if profile is None:
        print("\n  -> BUG FOUND: no api_userprofile row exists for this user.")
        print("     login_view falls back to role='USER' when this happens (see views.py login_view,")
        print("     `if hasattr(user, 'profile') ... except: pass`), which is why login succeeds but the")
        print("     Kitchen portal role check ('role !== KITCHEN') rejects it.")
        profile = UserProfile.objects.create(user=user, role=Role.KITCHEN)
        print("     Created api_userprofile with role=KITCHEN.")
    else:
        print(f"\n  api_userprofile.role = '{profile.role}'")
        if profile.role != Role.KITCHEN:
            print("  -> BUG FOUND: role is not 'KITCHEN'. This is why the Kitchen portal is rejecting the login.")
            profile.role = Role.KITCHEN
            profile.save()
            print("     Fixed: role set to KITCHEN.")
        else:
            print("  -> role is already correct. If login is still failing, the bug is elsewhere")
            print("     (e.g. a stale token attached to the login request, or a password mismatch).")

    kp, created = KitchenProfile.objects.get_or_create(
        user=user,
        defaults={'restaurant_name': 'KTM Bites Central Kitchen'}
    )
    print(f"\n  api_kitchenprofile: {'created (was missing)' if created else 'already existed'} "
          f"(restaurant_name='{kp.restaurant_name}')")

    print(f"\nDone. Final state -> role: {UserProfile.objects.get(user=user).role}, "
          f"is_active: {user.is_active}")
    print(f"Try logging in again at /kitchen with {KITCHEN_EMAIL}.")


if __name__ == "__main__":
    main()
