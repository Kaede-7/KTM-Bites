import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ktmbites.settings')
django.setup()

from api.models import Order

orders = Order.objects.all()
print(f"Total orders: {orders.count()}")
for o in orders:
    print(f"Order {o.id}: status={o.status}")
