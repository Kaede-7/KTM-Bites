# Cashier / Physical-store POS: CASHIER role, CashierProfile,
# POS order fields, and Kharcha/cash payment methods.
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0025_opt_in_calorie_target'),
        ('api', '0023_alter_userprofile_calorie_target'),
    ]

    operations = [
        migrations.CreateModel(
            name='CashierProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(blank=True, max_length=255)),
                ('username', models.CharField(blank=True, max_length=150)),
                ('store_name', models.CharField(default='KTM Bites — Thamel Outlet', max_length=255)),
                ('counter_name', models.CharField(blank=True, default='Counter 1', max_length=100)),
                ('employee_id', models.CharField(blank=True, max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='cashier_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(choices=[('ADMIN', 'Admin'), ('USER', 'User'), ('KITCHEN', 'Kitchen'), ('RIDER', 'Rider'), ('CASHIER', 'Cashier')], default='USER', max_length=20),
        ),
        migrations.AlterField(
            model_name='order',
            name='payment_method',
            field=models.CharField(choices=[('khalti', 'Khalti'), ('kharcha', 'Kharcha'), ('cash', 'Cash'), ('kharcha_qr', 'Kharcha QR'), ('kharcha_card', 'Kharcha Card')], default='khalti', max_length=20),
        ),
        migrations.AddField(
            model_name='order',
            name='order_type',
            field=models.CharField(choices=[('delivery', 'Delivery'), ('pickup', 'Store Pickup'), ('dine_in', 'Dine In / Counter')], default='delivery', max_length=20),
        ),
        migrations.AddField(
            model_name='order',
            name='amount_tendered',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='change_due',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='served_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='served_orders', to='api.cashierprofile'),
        ),
    ]
