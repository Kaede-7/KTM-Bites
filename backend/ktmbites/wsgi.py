"""
WSGI config for ktmbites project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
application = get_wsgi_application()
