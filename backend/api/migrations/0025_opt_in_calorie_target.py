from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0024_grouporder_live_schema_fix'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='calorie_target',
            field=models.PositiveIntegerField(blank=True, default=None, null=True),
        ),
    ]
