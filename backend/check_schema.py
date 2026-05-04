import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'ktmbites.settings'
django.setup()

from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='api_order' ORDER BY ordinal_position")
cols = [r[0] for r in cursor.fetchall()]
print("Existing columns:", cols)

# Check what's missing
expected = ['id','user_id','status','payment_method','payment_status','full_name','phone','address','city','landmark','notes','subtotal','delivery_fee','total','created_at','updated_at','pidx','transaction_id']
missing = [c for c in expected if c not in cols]
print("Missing columns:", missing)
