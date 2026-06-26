from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import api.models


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0020_calorie_tracking'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GroupOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('invite_code', models.CharField(db_index=True, default=api.models.generate_group_invite_code, max_length=32, unique=True)),
                ('status', models.CharField(choices=[('open', 'Open'), ('locked', 'Ready for payment'), ('paying', 'Payment in progress'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='open', max_length=20)),
                ('split_mode', models.CharField(choices=[('single', 'One person pays'), ('equal', 'Split evenly'), ('items', 'Each person pays for their items')], default='single', max_length=20)),
                ('full_name', models.CharField(blank=True, max_length=100)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('address', models.CharField(blank=True, max_length=255)),
                ('city', models.CharField(default='Kathmandu', max_length=50)),
                ('landmark', models.CharField(blank=True, max_length=100)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('host', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hosted_group_orders', to=settings.AUTH_USER_MODEL)),
                ('order', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='group_order', to='api.order')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='GroupOrderMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='api.grouporder')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='group_order_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['joined_at'], 'unique_together': {('group', 'user')}},
        ),
        migrations.CreateModel(
            name='GroupCartItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('added_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='group_cart_items', to=settings.AUTH_USER_MODEL)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='api.grouporder')),
                ('menu_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.menuitem')),
            ],
            options={'unique_together': {('group', 'added_by', 'menu_item')}},
        ),
        migrations.CreateModel(
            name='GroupPaymentShare',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('initiated', 'OTP sent'), ('paid', 'Paid'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('kharcha_payment_id', models.CharField(blank=True, max_length=255)),
                ('transaction_id', models.CharField(blank=True, max_length=255)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_shares', to='api.grouporder')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='group_payment_shares', to=settings.AUTH_USER_MODEL)),
            ],
            options={'unique_together': {('group', 'user')}},
        ),
    ]
