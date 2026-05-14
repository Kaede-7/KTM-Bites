
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from api.models import Order

order_id = 84
try:
    order = Order.objects.get(id=order_id)
    print(f"ID: {order.id}")
    print(f"Status: {order.status}")
    print(f"Payment Method: {order.payment_method}")
    print(f"Payment Status: {order.payment_status}")
    print(f"User: {order.user.email}")
except Order.DoesNotExist:
    print("Order not found")
