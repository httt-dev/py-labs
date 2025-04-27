import oracledb
import psycopg2
import pandas as pd
import hashlib

# Hàm kết nối và lấy dữ liệu từ Oracle
def get_data_oracle(query):
    conn = oracledb.connect(
        user="AIPBODEV",
        password="Abc12345",
        dsn="localhost:1522/ORCLPDB1"
    )
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# Hàm kết nối và lấy dữ liệu từ PostgreSQL
def get_data_postgres(query):
    conn = psycopg2.connect(
        dbname="bo_dev_jp_utf8",
        user="postgres",
        password="Abc12345",
        host="localhost",
        port="5432"
    )
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# Hàm tạo hash cho từng dòng để so sánh nhanh
def hash_row(row):
    return hashlib.md5(str(row.values).encode()).hexdigest()

# # Query bạn muốn chạy (nên có ORDER BY theo khóa chính)
# queryOracle = "SELECT * FROM MS_JAN PARTITION (MS_JAN_P01) ORDER BY JAN_CODE"
# queryPostgres = "SELECT * FROM ms_jan_p01 ORDER BY jan_code"

queryOracle = "SELECT * FROM ms_jan order by jan_code"
queryPostgres = "SELECT * FROM public.ms_jan order by jan_code"

# Lấy dữ liệu
oracle_df = get_data_oracle(queryOracle)
pg_df = get_data_postgres(queryPostgres)

# Tạo hash từng dòng
oracle_hashes = oracle_df.apply(hash_row, axis=1)
pg_hashes = pg_df.apply(hash_row, axis=1)

# So sánh kết quả
if oracle_hashes.equals(pg_hashes):
    print("✅ Dữ liệu giống nhau!")
else:
    print("❌ Dữ liệu khác nhau!")

    # Tùy chọn: hiển thị dòng khác nhau
    diffs = oracle_df[~oracle_hashes.isin(pg_hashes)]
    print("\nDòng khác trong Oracle:")
    print(diffs)

    diffs_pg = pg_df[~pg_hashes.isin(oracle_hashes)]
    print("\nDòng khác trong PostgreSQL:")
    print(diffs_pg)
