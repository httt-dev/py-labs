import oracledb
from src.helper.logger_helper import get_logger

log = get_logger()

oracledb.defaults.prefetchrows = 10000
oracledb.defaults.arraysize = 10000


def connect(connection_string=None, username=None, password=None, dsn=None):
    """
        Connect to Oracle database using either a connection string or individual parameters

        Parameters:
        connection_string - Full Oracle connection string (e.g., "username/password@host:port/service_name")
        username - Oracle username (used if connection_string is not provided)
        password - Oracle password (used if connection_string is not provided)
        dsn - Oracle DSN or TNS entry (used if connection_string is not provided)

        Returns:
        Connection object or None if connection fails
        """
    try:
        if connection_string:
            # Parse connection string
            if '/' in connection_string and '@' in connection_string:
                # Format: username/password@host:port/service_name
                auth, connect_part = connection_string.split('@', 1)
                username, password = auth.split('/', 1)

                # The connect_part becomes the dsn
                dsn = connect_part
            else:
                # Assume it's a TNS entry or EZ Connect string
                # For TNS: connection_string = "username/password@TNS_ENTRY"
                # For EZ Connect: connection_string = "username/password@hostname:port/service_name"
                username, rest = connection_string.split('/', 1)
                if '@' in rest:
                    password, dsn = rest.split('@', 1)
                else:
                    # Just username/password with no DSN specified
                    password = rest
                    dsn = None

        # Connect with the parsed or provided credentials
        connection = oracledb.connect(user=username, password=password, dsn=dsn)
        return connection
    except Exception as e:
        log.error(f"Error connecting to Oracle Database: {e}")
        return None
