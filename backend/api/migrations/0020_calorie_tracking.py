from django.db import migrations, models


KNOWN_CALORIES = {
    'Chicken Steam Momo': 420,
    'Buff Momo (Fried)': 560,
    'Margherita Pizza': 780,
    'Pepperoni Pizza': 920,
    'Classic Burger': 650,
    'Thakali Set': 850,
    'Chicken Chowmein': 610,
    'Iced Latte': 180,
    'Chocolate Brownie': 520,
}


def populate_calories(apps, schema_editor):
    MenuItem = apps.get_model('api', 'MenuItem')
    for name, calories in KNOWN_CALORIES.items():
        MenuItem.objects.filter(name=name).update(calories=calories)


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0019_riderprofile_rating_riderprofile_rating_count_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='calories',
            field=models.PositiveIntegerField(default=500),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='calorie_target',
            field=models.PositiveIntegerField(default=2000),
        ),
        migrations.RunPython(populate_calories, migrations.RunPython.noop),
    ]
