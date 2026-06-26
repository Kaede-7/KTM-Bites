from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0021_group_orders'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='grouporder',
            name='single_payment_mode',
            field=models.CharField(
                choices=[
                    ('treat', 'Pay for everyone'),
                    ('settle_later', 'Pay now and settle later in Kharcha'),
                ],
                default='treat',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='grouporder',
            name='kharcha_group_id',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='grouporder',
            name='kharcha_sync_status',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='grouporder',
            name='kharcha_missing_members',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='grouppaymentshare',
            name='payment_payer',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='initiated_group_payments',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='grouppaymentshare',
            name='paid_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sponsored_group_payments',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
