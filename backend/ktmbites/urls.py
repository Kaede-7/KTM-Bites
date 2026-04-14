"""
URL configuration for ktmbites project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
#api fetching url is http://localhost:8000/api/
