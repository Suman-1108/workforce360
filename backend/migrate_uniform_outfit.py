from app.database.session import engine
from sqlalchemy import text, inspect

inspector = inspect(engine)
cols = [c['name'] for c in inspector.get_columns('uniform_items')]

new_cols = [
    ('code', 'VARCHAR(50) NULL'),
    ('gender_group', "VARCHAR(50) NOT NULL DEFAULT 'Unisex'"),
    ('model_image_url', 'VARCHAR(500) NULL'),
    ('description', 'TEXT NULL'),
    ('colors', 'VARCHAR(100) NULL'),
    ('items_breakdown', 'TEXT NULL'),
    ('is_active', 'BOOLEAN NOT NULL DEFAULT TRUE'),
    ('is_archived', 'BOOLEAN NOT NULL DEFAULT FALSE'),
]

with engine.connect() as conn:
    for col_name, col_def in new_cols:
        if col_name not in cols:
            conn.execute(text(f'ALTER TABLE uniform_items ADD COLUMN {col_name} {col_def}'))
            print(f'Added {col_name}')
    conn.commit()

print('Schema migration completed successfully.')
