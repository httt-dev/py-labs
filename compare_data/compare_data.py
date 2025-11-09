import os
import pandas as pd
import psycopg2
import cx_Oracle
import subprocess
from dotenv import load_dotenv

load_dotenv()

TABLE_NAME = os.getenv("TABLE_NAME")
RANDOM_ROWS = int(os.getenv("RANDOM_ROWS"))
VPN_NAME = os.getenv("VPN_NAME")
VPN_USER = os.getenv("VPN_USER")
VPN_PASS = os.getenv("VPN_PASS")

# PostgreSQL
PG_CONN = psycopg2.connect(
    host=os.getenv("PG_HOST"),
    port=os.getenv("PG_PORT"),
    user=os.getenv("PG_USER"),
    password=os.getenv("PG_PASS"),
    dbname=os.getenv("PG_DB"),
)

# Oracle
cx_Oracle.init_oracle_client()
ORA_CONN = cx_Oracle.connect(
    os.getenv("ORACLE_USER"),
    os.getenv("ORACLE_PASS"),
    os.getenv("ORACLE_DSN"),
)

# ----------------------------------------------------------------------
# STEP 1: Lấy danh sách primary key của bảng
# ----------------------------------------------------------------------
def get_primary_keys_postgres(table):
    sql = """
    SELECT a.attname
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = %s::regclass AND i.indisprimary;
    """
    with PG_CONN.cursor() as cur:
        cur.execute(sql, (table,))
        pks = [row[0] for row in cur.fetchall()]

    print(f"PRIMARY KEYS = {pks}")
    return pks


PRIMARY_KEYS = get_primary_keys_postgres(TABLE_NAME)
ORDER_PK = ", ".join(PRIMARY_KEYS)

# ----------------------------------------------------------------------
# STEP 2: Query Postgres random rows
# ----------------------------------------------------------------------
sql_pg = f"""
SELECT * FROM {TABLE_NAME}
ORDER BY RANDOM()
LIMIT {RANDOM_ROWS}
"""

pg_df = pd.read_sql(sql_pg, PG_CONN).sort_values(by=PRIMARY_KEYS)

# ----------------------------------------------------------------------
# STEP 3: Sinh điều kiện WHERE cho Oracle
# ----------------------------------------------------------------------
where_conditions = []
for _, row in pg_df[PRIMARY_KEYS].iterrows():
    cond = " AND ".join([
        f"{pk} = '{row[pk]}'" if row[pk] is not None else f"{pk} IS NULL"
        for pk in PRIMARY_KEYS
    ])
    where_conditions.append(f"({cond})")

WHERE_ORACLE = " OR ".join(where_conditions)
print("\n--- WHERE FOR ORACLE ---")
print(WHERE_ORACLE)

# ----------------------------------------------------------------------
# STEP 4: Export Postgres → CSV
# ----------------------------------------------------------------------
os.makedirs("data", exist_ok=True)  # tạo folder nếu chưa tồn tại

pg_df.to_csv("data/postgres_data.csv", index=False, na_rep="<<NULL>>")

print("\n✅ Export Postgres → postgres_data.csv")

# ----------------------------------------------------------------------
# STEP 5: Connect VPN (Windows built-in VPN)
# ----------------------------------------------------------------------
# cmd = f'rasdial "{VPN_NAME}" {VPN_USER} {VPN_PASS}'
# subprocess.run(cmd, shell=True)

# print("\n✅ VPN connected")

# ----------------------------------------------------------------------
# STEP 6: Query Oracle theo điều kiện WHERE
# ----------------------------------------------------------------------
sql_ora = f"""
SELECT * FROM {TABLE_NAME}
WHERE {WHERE_ORACLE}
"""

ora_df = pd.read_sql(sql_ora, ORA_CONN)

# ✅ convert tất cả cột của oracle về lowercase
ora_df.columns = map(str.lower, ora_df.columns)

# ✅ sort theo danh sách PRIMARY_KEYS (cũng là lowercase)
ora_df = ora_df.sort_values(by=[pk.lower() for pk in PRIMARY_KEYS])


# ----------------------------------------------------------------------
# STEP 7: Export Oracle → CSV
# ----------------------------------------------------------------------
# Convert None → <<NULL>>
ora_df = ora_df.fillna("<<NULL>>")

ora_df.to_csv("data/oracle_data.csv", index=False, na_rep="<<NULL>>")
print("\n✅ Export Oracle → oracle_data.csv")

# ----------------------------------------------------------------------
# STEP 8: Mở WinMerge so sánh
# ----------------------------------------------------------------------
subprocess.run(['"C:\\Program Files\\WinMerge\\WinMergeU.exe"', 'data/postgres_data.csv', 'data/oracle_data.csv'], shell=True)

print("\n✅ DONE! WinMerge opened.")
