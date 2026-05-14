import os
import django
from django.conf import settings
from django.core.mail import send_mail
from dotenv import load_dotenv

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

def test_email():
    print(f"Using EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"Using EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"Using EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    
    try:
        send_mail(
            'Test Email',
            'This is a test email from KTM Bites.',
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER],
            fail_silently=False,
        )
        print("Success: Email sent!")
    except Exception as e:
        print(f"Failure: {e}")

if __name__ == "__main__":
    test_email()
