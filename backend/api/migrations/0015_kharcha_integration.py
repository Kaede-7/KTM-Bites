from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        # Replace with the actual last migration in your project
        ('api', '0014_remove_riderprofile_user_riderprofile_last_login_and_more'),
    ]

    operations = [
        # 1. Add 'kharcha' as a valid payment method choice on Order
        migrations.AlterField(
            model_name='order',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('esewa',   'eSewa'),
                    ('khalti',  'Khalti'),
                    ('kharcha', 'Kharcha'),
                    ('cod',     'Cash on Delivery'),
                ],
                default='esewa',
                max_length=20,
            ),
        ),

        # 2. Add kharcha_payment_id to Order (stores payment_id while OTP is pending)
        migrations.AddField(
            model_name='order',
            name='kharcha_payment_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),

        # 3. Create the KharchaLinkedAccount table
        migrations.CreateModel(
            name='KharchaLinkedAccount',
            fields=[
                ('id',               models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('link_token',       models.CharField(max_length=512)),
                ('authorization_id', models.CharField(max_length=255)),
                ('linked_at',        models.DateTimeField(auto_now_add=True)),
                ('is_active',        models.BooleanField(default=True)),
                ('user',             models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='kharcha_account',
                    to='auth.user',
                )),
            ],
            options={'verbose_name': 'Kharcha Linked Account'},
        ),
    ]