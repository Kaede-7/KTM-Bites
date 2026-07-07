from django.db import migrations

# This migration doesn't change Django's model state — 0021/0022 already
# declared the full GroupOrder schema (name, split_mode, address fields,
# Kharcha fields, invite_code, order link) and Django's migration table
# already marks those as applied. But the live `api_grouporder` table was
# apparently only ever created with a handful of columns (id, code, status,
# created_at, host_id), so the DB itself never actually got those columns.
#
# This migration brings the real table in line with the schema Django
# already believes exists, via plain SQL, without touching migration state.

FORWARD_SQL = """
ALTER TABLE api_grouporder RENAME COLUMN code TO invite_code;
ALTER TABLE api_grouporder ALTER COLUMN invite_code TYPE varchar(32);
ALTER TABLE api_grouporder ADD CONSTRAINT api_grouporder_invite_code_key UNIQUE (invite_code);

ALTER TABLE api_grouporder ADD COLUMN name varchar(100) NOT NULL DEFAULT '';
ALTER TABLE api_grouporder ALTER COLUMN name DROP DEFAULT;

ALTER TABLE api_grouporder ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE api_grouporder ADD COLUMN split_mode varchar(20) NOT NULL DEFAULT 'single';
ALTER TABLE api_grouporder ADD COLUMN single_payment_mode varchar(20) NOT NULL DEFAULT 'treat';
ALTER TABLE api_grouporder ADD COLUMN kharcha_group_id varchar(255) NOT NULL DEFAULT '';
ALTER TABLE api_grouporder ADD COLUMN kharcha_sync_status varchar(20) NOT NULL DEFAULT '';
ALTER TABLE api_grouporder ADD COLUMN kharcha_missing_members jsonb NOT NULL DEFAULT '[]';

ALTER TABLE api_grouporder ADD COLUMN full_name varchar(100) NOT NULL DEFAULT '';
ALTER TABLE api_grouporder ADD COLUMN phone varchar(20) NOT NULL DEFAULT '';
ALTER TABLE api_grouporder ADD COLUMN address varchar(255) NOT NULL DEFAULT '';
ALTER TABLE api_grouporder ADD COLUMN city varchar(50) NOT NULL DEFAULT 'Kathmandu';
ALTER TABLE api_grouporder ADD COLUMN landmark varchar(100) NOT NULL DEFAULT '';
ALTER TABLE api_grouporder ADD COLUMN notes text NOT NULL DEFAULT '';

ALTER TABLE api_grouporder ADD COLUMN order_id bigint NULL;
ALTER TABLE api_grouporder ADD CONSTRAINT api_grouporder_order_id_key UNIQUE (order_id);
ALTER TABLE api_grouporder
    ADD CONSTRAINT api_grouporder_order_id_fk_api_order
    FOREIGN KEY (order_id) REFERENCES api_order (id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;
"""

REVERSE_SQL = """
ALTER TABLE api_grouporder DROP CONSTRAINT IF EXISTS api_grouporder_order_id_fk_api_order;
ALTER TABLE api_grouporder DROP CONSTRAINT IF EXISTS api_grouporder_order_id_key;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS order_id;

ALTER TABLE api_grouporder DROP COLUMN IF EXISTS notes;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS landmark;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS city;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS address;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS phone;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS full_name;

ALTER TABLE api_grouporder DROP COLUMN IF EXISTS kharcha_missing_members;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS kharcha_sync_status;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS kharcha_group_id;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS single_payment_mode;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS split_mode;

ALTER TABLE api_grouporder DROP COLUMN IF EXISTS updated_at;
ALTER TABLE api_grouporder DROP COLUMN IF EXISTS name;

ALTER TABLE api_grouporder DROP CONSTRAINT IF EXISTS api_grouporder_invite_code_key;
ALTER TABLE api_grouporder RENAME COLUMN invite_code TO code;
"""


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_group_order_member_host'),
    ]

    operations = [
        migrations.RunSQL(sql=FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
