import os
import re
import subprocess
import time
import concurrent.futures
from typing import Tuple, Optional
from .database import oracle_db, postgres_db
from .helper.csv_export import export_to_csv
from .helper.logger_helper import get_logger

# Initialize logger
log = get_logger()



def connect_to_database(db_type: str, use_conn_string: bool, conn_string: str = "",
                        username: str = "", password: str = "", dsn: str = "",
                        host: str = "", database: str = "", port: str = "") -> Optional[object]:
    """
    Connect to a database based on the provided type and connection details.

    Args:
        db_type: Database type ("Oracle" or "PostgreSQL").
        use_conn_string: If True, use connection string; else, use individual parameters.
        conn_string: Connection string for the database.
        username: Database username.
        password: Database password.
        dsn: DSN for Oracle (host:port/service_name or TNS entry).
        host: Host for PostgreSQL.
        database: Database name for PostgreSQL.
        port: Port for PostgreSQL.

    Returns:
        Database connection object or None if connection fails.
    """
    try:
        if db_type.lower() == "oracle":
            if use_conn_string:
                if not conn_string:
                    log.error("Connection string is required for Oracle!")
                    raise ValueError("Connection string is required")
                return oracle_db.connect(connection_string=conn_string)
            else:
                if not all([username, password]):
                    log.error("Username and password are required for Oracle!")
                    raise ValueError("Username and password are required")
                return oracle_db.connect(username=username, password=password, dsn=dsn)
        elif db_type.lower() == "postgresql":
            if use_conn_string:
                if not conn_string:
                    log.error("Connection string is required for PostgreSQL!")
                    raise ValueError("Connection string is required")
                return postgres_db.connect(connection_string=conn_string)
            else:
                if not all([host, database, username, password]):
                    log.error("All fields (host, database, username, password) are required for PostgreSQL!")
                    raise ValueError("All fields are required")
                port_num = int(port) if port else 5432
                return postgres_db.connect(
                    host=host,
                    database=database,
                    user=username,
                    password=password,
                    port=port_num
                )
        else:
            log.error(f"Unsupported database type: {db_type}")
            raise ValueError(f"Unsupported database type: {db_type}")
    except Exception as e:
        log.error(f"Error connecting to {db_type} database: {str(e)}")
        return None


def execute_query(connection: object, query: str, db_type: str) -> Tuple[bool, Optional[object], str]:
    """
    Execute a SQL query on the provided database connection.

    Args:
        connection: Database connection object.
        query: SQL query to execute.
        db_type: Database type ("Oracle" or "PostgreSQL").

    Returns:
        Tuple (success, cursor): Success indicates if query executed successfully; cursor is the query cursor or None.
    """
    if not connection:
        log.warning(f"Not connected to {db_type} database!")
        return False, None, f"Not connected to database!"

    if not query:
        log.warning(f"Query for {db_type} is empty!")
        return False, None, f"Query is empty!"
    try:
        # if query.strip().upper().startswith("SELECT") \
        if not is_modifying_query(query):
            start_time = time.time()
            if db_type.lower() == "oracle":
                connection.lobprefetchsize = 1048576  # Prefetch up to 1MB of LOB data
            cursor = connection.cursor()
            if db_type.lower() == "oracle":
                cursor.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD' NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24.MI.SSXFF' NLS_TIMESTAMP_TZ_FORMAT = 'YYYY-MM-DD HH24.MI.SSXFF TZR'")
                log.info(f"Executed SET NLS_DATE_FORMAT query.")
            # cursor.execute(query.rstrip(";"))
            cursor.execute(query)
            elapsed_time = time.time() - start_time
            log.info(f"Executed {db_type} query: \n{query}\n in {elapsed_time:.3f} seconds.")
            return True, cursor, ""
        else:
            log.warning(f"Not allowed to execute {db_type} non-SELECT queries!")
            return False, None, f"Not allowed to execute non-SELECT queries!"
    except Exception as e:
        log.error(f"Error executing {db_type} query: {str(e)}")
        return False, None, f"{str(e)}"


def export_query_results(cursor: Optional[object], db_type: str, work_dir: str) -> Tuple[bool, str]:
    """
    Export query results to a CSV file.

    Args:
        cursor: Database cursor with query results.
        db_type: Database type ("Oracle" or "PostgreSQL").

    Returns:
        Tuple (success, result): Success indicates if export was successful; result is CSV path or error message.
    """
    if not cursor:
        log.warning(f"No results from {db_type} query to export!")
        return False, f"No results from {db_type} query to export!"
    if cursor.description:
        headers = [str(col[0]).lower() for col in cursor.description] if cursor else None
        return export_to_csv(None, cursor, work_dir, headers, db_type)
    else:
        return export_to_csv(None, cursor, work_dir, None, db_type)


def run(
        left_db_type: str, left_use_conn_string: str, left_conn_string: str, left_username: str,
        left_password: str, left_dsn: str, left_host: str, left_database: str, left_port: str, left_query: str,
        right_db_type: str, right_use_conn_string: str, right_conn_string: str, right_username: str,
        right_password: str, right_dsn: str, right_host: str, right_database: str, right_port: str, right_query: str,
        work_dir: str,
        winmerge_path: str = ""
) -> str:
    """
    Compare query results from two databases and optionally launch WinMerge for visual comparison.

    Args:
        left_db_type: Source database type ("Oracle" or "PostgreSQL").
        left_use_conn_string: "True" to use connection string, "False" for individual parameters.
        left_conn_string: Connection string for source database.
        left_username: Username for source database.
        left_password: Password for source database.
        left_dsn: DSN for Oracle source database.
        left_host: Host for PostgreSQL source database.
        left_database: Database name for PostgreSQL source database.
        left_port: Port for PostgreSQL source database.
        left_query: SQL query for source database.
        right_db_type: Target database type ("Oracle" or "PostgreSQL").
        right_use_conn_string: "True" to use connection string, "False" for individual parameters.
        right_conn_string: Connection string for target database.
        right_username: Username for target database.
        right_password: Password for target database.
        right_dsn: DSN for Oracle target database.
        right_host: Host for PostgreSQL target database.
        right_database: Database name for PostgreSQL target database.
        right_port: Port for PostgreSQL target database.
        right_query: SQL query for target database.
        work_dir: Working directory.
        winmerge_path: Path to WinMerge executable (optional).

    Returns:
        Comparison result as a string or error message if comparison fails.
    """
    errors = {}

    # Convert string boolean to actual boolean
    left_use_conn = left_use_conn_string.lower() == "true"
    right_use_conn = right_use_conn_string.lower() == "true"

    # Connect to databases
    left_connection = connect_to_database(
        left_db_type, left_use_conn, left_conn_string, left_username,
        left_password, left_dsn, left_host, left_database, left_port
    )
    right_connection = connect_to_database(
        right_db_type, right_use_conn, right_conn_string, right_username,
        right_password, right_dsn, right_host, right_database, right_port
    )

    if not left_connection:
        errors[left_db_type] = f"Failed to connect to {left_db_type} database"
    if not right_connection:
        errors[right_db_type] = f"Failed to connect to {right_db_type} database"
    if errors:
        return "\n".join(f"{db}: {msg}" for db, msg in errors.items())

    # Execute queries and export results concurrently
    left_csv_path = ""
    right_csv_path = ""
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        def execute_and_export_left():
            success, cursor, message = execute_query(left_connection, left_query, left_db_type)
            if success:
                is_success, result = export_query_results(cursor, left_db_type, work_dir)
                if not is_success:
                    errors[left_db_type] = result
                    return ""
                return result
            errors[left_db_type] = errors.get(left_db_type, message)
            return ""

        def execute_and_export_right():
            success, cursor, message = execute_query(right_connection, right_query, right_db_type)
            if success:
                is_success, result = export_query_results(cursor, right_db_type, work_dir)
                if not is_success:
                    errors[right_db_type] = result
                    return ""
                return result
            errors[right_db_type] = errors.get(right_db_type, message)
            return ""

        future1 = executor.submit(execute_and_export_left)
        future2 = executor.submit(execute_and_export_right)
        concurrent.futures.wait([future1, future2])

        for future in [future1, future2]:
            if future.exception():
                log.error(str(future.exception()))
                raise future.exception()

        left_csv_path = future1.result()
        right_csv_path = future2.result()

    # Close connections
    if left_connection:
        left_connection.close()
    if right_connection:
        right_connection.close()

    # Check for errors or empty results
    if errors:
        return "\n".join(f"{db}: {msg}" for db, msg in errors.items())
    if not left_csv_path or not right_csv_path:
        error_msg = ""
        if not left_csv_path:
            error_msg += f"{left_db_type}: {errors.get(left_db_type, 'No CSV file generated')}"
        if not right_csv_path:
            error_msg += f"\n{right_db_type}: {errors.get(right_db_type, 'No CSV file generated')}"
        return error_msg.strip()

    # Compare CSV files
    # comparison_result = efficient_compare_large_csv(left_csv_path, right_csv_path)
    # log.info(f"CSV Comparison Result:\n{comparison_result}")

    # Optionally launch WinMerge
    if winmerge_path:
        if not os.path.exists(winmerge_path):
            log.error("WinMerge not found at the specified path")
            return f"WinMerge not found at the specified path"
        if not (os.path.exists(left_csv_path) and os.path.exists(right_csv_path)):
            log.error("One or both CSV files not found")
            return f"One or both CSV files not found"
        try:
            log.info("Launching WinMerge with the two CSV files")
            subprocess.Popen([winmerge_path, left_csv_path, right_csv_path], shell=False)
            return f"WinMerge launched!"
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            log.error(f"Failed to launch WinMerge: {str(e)}")
            return f"Failed to launch WinMerge: {str(e)}"

    return "Not launch WinMerge"


def is_modifying_query(query: str) -> bool:
    """
    Check if the query is a modifying (non-SELECT) query.

    Args:
        query: SQL query to check.

    Returns:
        True if the query is modifying (INSERT, UPDATE, DELETE, CREATE), False otherwise.
    """
    pattern = r'\b(INSERT|UPDATE|DELETE|CREATE)\b'
    return bool(re.search(pattern, query.upper()))
