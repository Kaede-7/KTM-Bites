from django.db import connection

for table in ['api_grouporder', 'api_groupordermember', 'api_groupcartitem', 'api_grouppaymentshare']:
    with connection.cursor() as c:
        c.execute(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
            "WHERE table_name = %s ORDER BY ordinal_position",
            [table],
        )
        rows = c.fetchall()
        print(f'--- {table} ---')
        if not rows:
            print('  (table not found)')
        for name, dtype, nullable in rows:
            print(f'  {name} ({dtype}, nullable={nullable})')
