import os
import django
import sys
from unittest.mock import patch, MagicMock

# Setup django environment
sys.path.append(r'c:\Users\Saksham\Documents\KTM-Bites(Main)\KTM-Bites\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import User
from api.views import google_login_view

factory = RequestFactory()

# We want to simulate the Google login with an access token
mock_user_info = {
    'email': 'testuser_existing@example.com',
    'given_name': 'Test',
    'family_name': 'User',
    'name': 'Test User',
}

@patch('requests.get')
def run_test(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = mock_user_info
    mock_response.status_code = 200
    mock_get.return_value = mock_response

    # Test 1: User doesn't exist, role='USER'
    print("\n--- Test 1: User does not exist, role USER ---")
    request1 = factory.post('/api/auth/google/', {
        'access_token': 'mock_access_token_123',
        'role': 'USER'
    }, content_type='application/json')
    response1 = google_login_view(request1)
    print("Response status code:", response1.status_code)
    print("Response data:", getattr(response1, 'data', None))

    # Test 2: User exists, role='USER'
    print("\n--- Test 2: User exists, role USER ---")
    request2 = factory.post('/api/auth/google/', {
        'access_token': 'mock_access_token_123',
        'role': 'USER'
    }, content_type='application/json')
    response2 = google_login_view(request2)
    print("Response status code:", response2.status_code)
    print("Response data:", getattr(response2, 'data', None))

    # Test 3: User exists, role='RIDER'
    print("\n--- Test 3: User exists, role RIDER ---")
    request3 = factory.post('/api/auth/google/', {
        'access_token': 'mock_access_token_123',
        'role': 'RIDER'
    }, content_type='application/json')
    response3 = google_login_view(request3)
    print("Response status code:", response3.status_code)
    print("Response data:", getattr(response3, 'data', None))

try:
    # Cleanup any existing test user first to start clean
    User.objects.filter(email='testuser_existing@example.com').delete()
    run_test()
except Exception as e:
    import traceback
    traceback.print_exc()
