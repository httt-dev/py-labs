import psycopg2
from src.helper.logger_helper import get_logger

log = get_logger()

def connect(connection_string=None, host=None, database=None, user=None, password=None, port=5432):
    """
    Connect to PostgreSQL database using either a connection string or individual parameters

    Parameters:
    connection_string - Full PostgreSQL connection string
                      (e.g., "postgresql://username:password@host:port/dbname")
    host - Database server host (used if connection_string is not provided)
    database - Database name (used if connection_string is not provided)
    user - Database username (used if connection_string is not provided)
    password - Database password (used if connection_string is not provided)
    port - Database server port (used if connection_string is not provided)

    Returns:
    Connection object or None if connection fails
    """
    try:
        if connection_string:
            connection = psycopg2.connect(connection_string)
        else:
            connection = psycopg2.connect(
                host=host,
                database=database,
                user=user,
                password=password,
                port=port
            )
        return connection
    except Exception as e:
        log.error(f"Error connecting to PostgreSQL Database: {e}")
        return None
