"""
Django settings for ktmbites project.
"""

from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-fallback-key')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ktmbites.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ktmbites.wsgi.application'

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- REST Framework Configuration ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly', 
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5000/hour',
        'user': '10000/hour',
        'forgot_password': '10/minute',
    }
}

# --- CORS Configuration ---
CORS_ALLOW_CREDENTIALS = True
CORS_PREFLIGHT_MAX_AGE = 600

CORS_ALLOWED_ORIGINS = [
    "https://ktm-bites.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

# Fallback/broad settings to ensure maximum compatibility
CORS_ALLOW_ALL_ORIGINS = True
CORS_ORIGIN_ALLOW_ALL = True

# --- CSRF Configuration ---
CSRF_TRUSTED_ORIGINS = [
    "https://ktm-bites.vercel.app",
    "https://ktm-bites-production.up.railway.app",
]

# --- Security Headers ---
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin-allow-popups'

# --- Khalti Payment Gateway (TEST) ---
KHALTI_SECRET_KEY = os.environ.get('KHALTI_SECRET_KEY', '')
KHALTI_PUBLIC_KEY = os.environ.get('KHALTI_PUBLIC_KEY', '')
KHALTI_BASE_URL = 'https://dev.khalti.com/api/v2'  # TEST/sandbox endpoint

# --- AI Integration ---
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')

# --- Email Configuration (Gmail SMTP) ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'np03cs4a240042@gmail.com').strip()
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '').strip()
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Kharcha integration
KHARCHA_BASE_URL      = os.environ.get('KHARCHA_BASE_URL',      'https://kharcha-production.up.railway.app')
KHARCHA_FRONTEND_URL  = os.environ.get('KHARCHA_FRONTEND_URL',  'http://kharcha-omega.vercel.app')
KHARCHA_REDIRECT_URI  = os.environ.get('KHARCHA_REDIRECT_URI',  'http://localhost:8000/api/kharcha/callback/')
KHARCHA_CLIENT_ID     = os.environ.get('KHARCHA_CLIENT_ID',     '')
KHARCHA_CLIENT_SECRET = os.environ.get('KHARCHA_CLIENT_SECRET', '')
KHARCHA_API_KEY       = os.environ.get('KHARCHA_API_KEY', '')
KHARCHA_REDIRECT_BASE = os.environ.get('KHARCHA_REDIRECT_BASE', 'http://localhost:8000/api')
KHARCHA_WEBHOOK_URL   = os.environ.get('KHARCHA_WEBHOOK_URL',   '')
FRONTEND_BASE_URL     = os.environ.get('FRONTEND_BASE_URL',     'http://localhost:5173')
BACKEND_BASE_URL      = os.environ.get('BACKEND_BASE_URL',      'http://localhost:8000')