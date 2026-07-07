from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_group_sponsorship_and_kharcha_sync'),
    ]

    operations = [
        migrations.RenameField(
            model_name='groupordermember',
            old_name='group',
            new_name='group_order',
        ),
        migrations.AddField(
            model_name='groupordermember',
            name='is_host',
            field=models.BooleanField(default=False),
        ),
    ]
