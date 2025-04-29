import cx_Oracle
import psycopg
import os
from dotenv import load_dotenv
from tabulate import tabulate
from html import escape

load_dotenv()

TYPE_MAPPING = {
    "BLOB": "bytea",
    "CHAR": "character",
    "CLOB": "text",
    "NUMBER": ["integer", "smallint", "bigint", "double precision", "numeric"],
    "RAW": "bytea",
    "VARCHAR2": "character varying",
    "DATE": "timestamp without time zone",
    "TIMESTAMP(6)": "timestamp without time zone",
    "TIMESTAMP(6) WITH TIME ZONE": "timestamp with time zone",
}

def ansi_to_html(text):
    return (
        text.replace("\033[91m", '<span style="color: red;">')
            .replace("\033[92m", '<span style="color: green;">')
            .replace("\033[0m", '</span>')
    )

def connect_oracle():
    dsn = os.getenv("ORACLE_DSN")
    user = os.getenv("ORACLE_USER")
    password = os.getenv("ORACLE_PASSWORD")
    return cx_Oracle.connect(user, password, dsn)

def connect_postgres():
    return psycopg.connect(
        host=os.getenv("PG_HOST"),
        port=os.getenv("PG_PORT"),
        dbname=os.getenv("PG_DATABASE"),
        user=os.getenv("PG_USER"),
        password=os.getenv("PG_PASSWORD"),
        autocommit=True,
        row_factory=psycopg.rows.tuple_row,
    )

def get_oracle_tables(cursor):
    cursor.execute("SELECT table_name FROM user_tables where table_name IN('TB_STOCK_HISTORY','TB_SHIPPING_BODY','TB_SHIPPING_HEAD','TB_SALES_VAT_RATE_TOTAL','TB_RECEIVING_BODY','TB_RECEIVING_HEAD','TB_ORDER_HEAD','TB_ORDER_BODY') ORDER BY table_name")
    return [row[0] for row in cursor.fetchall()]

def get_columns_oracle(cursor, table):
    cursor.execute(f"""
        SELECT column_name, data_type, data_length, data_precision, data_scale
        FROM user_tab_columns
        WHERE table_name = '{table}'
    """)
    return {row[0]: row[1:] for row in cursor.fetchall()}

def get_columns_postgres(cursor, table):
    cursor.execute(f"""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = lower('{table.lower()}')
    """)
    return {row[0].upper(): row[1:] for row in cursor.fetchall()}

def get_indexes_oracle(cursor, table):
    cursor.execute(f"""
        SELECT index_name, column_name
        FROM user_ind_columns
        WHERE table_name = '{table}'
        ORDER BY index_name, column_position
    """)
    indexes = {}
    for idx_name, col in cursor.fetchall():
        indexes.setdefault(idx_name, []).append(col.upper())
    return indexes

def get_indexes_postgres(cursor, table):
    cursor.execute(f"""
        SELECT i.relname, a.attname
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = lower('{table.lower()}')
        ORDER BY i.relname, array_position(ix.indkey, a.attnum)
    """)
    indexes = {}
    for idx_name, col in cursor.fetchall():
        indexes.setdefault(idx_name.upper(), []).append(col.upper())
    return indexes

def get_primary_key_columns_oracle(cursor, table):
    cursor.execute(f"""
        SELECT cols.column_name
        FROM user_constraints cons
        JOIN user_cons_columns cols ON cons.constraint_name = cols.constraint_name
        WHERE cons.constraint_type = 'P' AND cons.table_name = '{table}'
        ORDER BY cols.position
    """)
    return [row[0].upper() for row in cursor.fetchall()]

def get_primary_key_columns_postgres(cursor, table):
    cursor.execute(f"""
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = lower('{table.lower()}')::regclass AND i.indisprimary
        ORDER BY array_position(i.indkey, a.attnum)
    """)
    return [row[0].upper() for row in cursor.fetchall()]

def get_foreign_keys_oracle(cursor, table):
    cursor.execute(f"""
        SELECT a.column_name, c_pk.table_name AS referenced_table, b.column_name AS referenced_column
        FROM user_constraints c
        JOIN user_cons_columns a ON c.constraint_name = a.constraint_name
        JOIN user_constraints c_pk ON c.r_constraint_name = c_pk.constraint_name
        JOIN user_cons_columns b ON c_pk.constraint_name = b.constraint_name AND a.position = b.position
        WHERE c.constraint_type = 'R' AND c.table_name = '{table}'
        ORDER BY a.column_name
    """)
    return [(row[0].upper(), row[1].upper(), row[2].upper()) for row in cursor.fetchall()]

def get_foreign_keys_postgres(cursor, table):
    cursor.execute(f"""
        SELECT
            att2.attname AS column_name,
            cl.relname AS referenced_table,
            att.attname AS referenced_column
        FROM
            pg_constraint con
        JOIN pg_class tbl ON tbl.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS cols(colid, ord)
        JOIN pg_attribute att2 ON att2.attrelid = con.conrelid AND att2.attnum = cols.colid
        CROSS JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS refcols(colid, ord)
        JOIN pg_attribute att ON att.attrelid = con.confrelid AND att.attnum = refcols.colid AND refcols.ord = cols.ord
        JOIN pg_class cl ON cl.oid = con.confrelid
        WHERE 
            con.contype = 'f'
            AND tbl.relname = lower(%s)
            AND tbl.relkind IN ('r', 'p')
            AND NOT EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = tbl.oid)
            AND NOT EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = cl.oid)    
        ORDER BY att2.attname
    """, (table,))
    return [(row[0].upper(), row[1].upper(), row[2].upper()) for row in cursor.fetchall()]

def map_type(oracle_type, precision=None, scale=None):
    pg_type = TYPE_MAPPING.get(oracle_type)
    if isinstance(pg_type, list):
        if precision and scale:
            return "numeric"
        elif precision and precision <= 4:
            return "smallint"
        elif precision and precision < 10:
            return "integer"
        elif precision and precision < 19:
            return "bigint"
        else:
            return "numeric"
    return pg_type

def compare_tables(oracle_cols, pg_cols):
    RED = "\033[91m"
    RESET = "\033[0m"
    result = []
    for col_name, (ora_type, ora_len, ora_prec, ora_scale) in oracle_cols.items():
        pg_col = pg_cols.get(col_name)
        expected_pg_type = map_type(ora_type, ora_prec, ora_scale)
        status = "OK"
        icon = ""
        if not pg_col:
            status = f"Missing in PostgreSQL"
            pg_type = pg_len = None
            icon = "\U0001F534"
        else:
            pg_type, pg_len = pg_col
            if expected_pg_type != pg_type:
                status = f"Type mismatch (expected {expected_pg_type})"
                icon = "\U0001F534"
            elif expected_pg_type in ("character varying", "character") and ora_len != pg_len:
                status = f"Length mismatch (Oracle: {ora_len}, PG: {pg_len})"
                icon = "\U0001F534"
        full_status = f"{icon} {RED}{status}{RESET}" if icon else status
        result.append([col_name, ora_type, expected_pg_type, pg_type, ora_len, pg_len, full_status])
    return result

def compare_indexes(ora_indexes, pg_indexes, ora_pk, pg_pk):
    RED = "\033[91m"
    RESET = "\033[0m"
    results = []
    if len(ora_indexes) != len(pg_indexes):
        results.append(["Index Count", len(ora_indexes), len(pg_indexes), f"\U0001F534 {RED}Mismatch{RESET}"])
    else:
        results.append(["Index Count", len(ora_indexes), len(pg_indexes), "OK"])

    normalized_pg_indexes = {key.replace('_IDX', ''): cols for key, cols in pg_indexes.items()}
    all_keys = set(ora_indexes.keys()).union(normalized_pg_indexes.keys())
    for key in sorted(all_keys):
        ora_cols = ora_indexes.get(key)
        pg_cols = normalized_pg_indexes.get(key)
        if not ora_cols or not pg_cols:
            results.append([key, ora_cols, pg_cols, f"\U0001F534 {RED}Missing Index{RESET}"])
        elif sorted([c.upper() for c in ora_cols]) != sorted([c.upper() for c in pg_cols]):
            results.append([key, ora_cols, pg_cols, f"\U0001F534 {RED}Column Order Mismatch{RESET}"])
        else:
            results.append([key, ora_cols, pg_cols, "OK"])

    if ora_pk != pg_pk:
        results.append(["Primary Key", ora_pk, pg_pk, f"\U0001F534 {RED}Mismatch{RESET}"])
    else:
        results.append(["Primary Key", ora_pk, pg_pk, "OK"])
    return results

def compare_foreign_keys(ora_fks, pg_fks):
    RED = "\033[91m"
    RESET = "\033[0m"
    results = []
    if len(ora_fks) != len(pg_fks):
        results.append(["Foreign Key Count", len(ora_fks), len(pg_fks), f"\U0001F534 {RED}Mismatch{RESET}"])
    else:
        results.append(["Foreign Key Count", len(ora_fks), len(pg_fks), "OK"])

    for fk in ora_fks:
        if fk not in pg_fks:
            results.append([fk[0], f"{fk[1]}.{fk[2]}", "-", f"\U0001F534 {RED}Missing in PostgreSQL{RESET}"])
        else:
            results.append([fk[0], f"{fk[1]}.{fk[2]}", f"{fk[1]}.{fk[2]}", "OK"])

    for fk in pg_fks:
        if fk not in ora_fks:
            results.append([fk[0], "-", f"{fk[1]}.{fk[2]}", f"\U0001F534 {RED}Extra in PostgreSQL{RESET}"])
    return results

def main():
    RED = "\033[91m"
    GREEN = "\033[92m"
    RESET = "\033[0m"

    html_logs = []

    ora_conn = connect_oracle()
    pg_conn = connect_postgres()
    ora_cursor = ora_conn.cursor()
    pg_cursor = pg_conn.cursor()

    tables = get_oracle_tables(ora_cursor)
    summary = []

    for table in tables:
        print(f"\n🔍 Checking table: {table}")
        html_logs.append(f"<h2>🔍 Checking table: {escape(table)}</h2>")

        oracle_cols = get_columns_oracle(ora_cursor, table)
        pg_cols = get_columns_postgres(pg_cursor, table)
        comparison = compare_tables(oracle_cols, pg_cols)

        print(tabulate(comparison, headers=["Column", "Oracle Type", "Expected PG Type", "Actual PG Type", "Oracle Length", "PG Length", "Status"], tablefmt="grid"))
        html_logs.append(ansi_to_html(tabulate(comparison, headers=["Column", "Oracle Type", "Expected PG Type", "Actual PG Type", "Oracle Length", "PG Length", "Status"], tablefmt="html")))

        ora_indexes = get_indexes_oracle(ora_cursor, table)
        pg_indexes = get_indexes_postgres(pg_cursor, table)
        ora_pk = get_primary_key_columns_oracle(ora_cursor, table)
        pg_pk = get_primary_key_columns_postgres(pg_cursor, table)
        index_results = compare_indexes(ora_indexes, pg_indexes, ora_pk, pg_pk)

        print("\nIndexes and Primary Key:")
        print(tabulate(index_results, headers=["Index Name", "Oracle", "Postgres", "Status"], tablefmt="fancy_grid"))
        html_logs.append("<h3>Indexes and Primary Key</h3>")
        html_logs.append(ansi_to_html(tabulate(index_results, headers=["Index Name", "Oracle", "Postgres", "Status"], tablefmt="html")))

        ora_fks = get_foreign_keys_oracle(ora_cursor, table)
        pg_fks = get_foreign_keys_postgres(pg_cursor, table)
        fk_results = compare_foreign_keys(ora_fks, pg_fks)

        print("\nForeign Keys:")
        print(tabulate(fk_results, headers=["Column", "Oracle Ref", "Postgres Ref", "Status"], tablefmt="fancy_grid"))
        html_logs.append("<h3>Foreign Keys</h3>")
        html_logs.append(ansi_to_html(tabulate(fk_results, headers=["Column", "Oracle Ref", "Postgres Ref", "Status"], tablefmt="html")))

        has_error = any("\U0001F534" in row[-1] for row in comparison + index_results + fk_results)
        if has_error:
            summary.append([table, f"\U0001F534 {RED}ERROR{RESET}"])
        else:
            summary.append([table, f"{GREEN}OK{RESET}"])

    print("\n📋 Summary of all tables:")
    print(tabulate(summary, headers=["Table", "Status"], tablefmt="fancy_grid"))
    html_logs.append("<h2>📋 Summary of all tables</h2>")
    html_logs.append(ansi_to_html(tabulate(summary, headers=["Table", "Status"], tablefmt="html")))

    with open("comparison_report.html", "w", encoding="utf-8") as f:
        f.write("<html><head><meta charset='UTF-8'><title>Comparison Report</title></head><body>")
        f.write("\n".join(html_logs))
        f.write("</body></html>")

    print("\n📁 HTML report saved to comparison_report.html")

    ora_cursor.close()
    pg_cursor.close()
    ora_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    main()
