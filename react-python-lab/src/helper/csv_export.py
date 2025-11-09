import os
import time
import re
from datetime import datetime
from decimal import Decimal

from src.helper.logger_helper import get_logger

log = get_logger()

batch_size = 50000  # Writing in chunks for efficiency


def export_to_csv(parent_widget, cursor, work_dir, headers=None, name=''):
    """
    Export data or DBMS_OUTPUT to a CSV file with comma delimiter

    Parameters:
    parent_widget - The parent widget to use for the file dialog
    cursor - Cursor with data from SELECT or after PL/SQL (DBMS_OUTPUT for Oracle)
    work_dir - Base path to write CSV
    headers - Optional list of column names
    name - Name used in the output filename

    Returns:
    (bool, str) - Success status and output path or error message
    """

    if not cursor:
        log.warning(f"No cursor provided for {name}!")
        return False, f"No cursor provided for {name}!"

    filename = f"{name}_query_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    base_path = os.path.expandvars(work_dir)
    filepath = os.path.join(base_path, "query", name)
    os.makedirs(filepath, exist_ok=True)

    try:
        start_time = time.time()
        full_path = os.path.join(filepath, filename)
        with open(full_path, 'w', newline='', encoding='utf-8') as csvfile:
            batch = []
            row_count = 0

            if headers:
                # Write provided headers
                csvfile.write(','.join(headers) + '\n')
                batch = []
                row_count = 0
                for row in cursor:  # Iterate over cursor directly
                    # Convert row to strings, handling None, empty and special characters
                    row_str = []
                    for item in row:
                        if item is None:
                            item = '<<NULL>>'
                        elif item == '':
                            item = '<<EMPTY>>'
                        elif isinstance(item, float) or isinstance(item, Decimal):
                            item = str(item)
                            if '.' in item:
                                item = item.rstrip('0').rstrip('.')
                        else:
                            item = str(item).replace(',', '\\,').replace('\n', ' ').replace('\r', ' ')
                        row_str.append(item)
                    batch.append(','.join(row_str))
                    if len(batch) >= batch_size:
                        csvfile.write('\n'.join(batch) + '\n')
                        row_count += len(batch)
                        log.info(f"Wrote {filename} records {row_count - len(batch)} to {row_count}")
                        batch = []
                if batch:  # Write remaining rows
                    csvfile.write('\n'.join(batch) + '\n')
                    row_count += len(batch)
                    log.info(f"Wrote {filename} records {row_count - len(batch)} to {row_count}")

            else:
                # Handle DBMS_OUTPUT for Oracle
                columns = []  # Store unique column names in order of appearance
                row_data = {}  # Store column:value pairs for a single row

                # Read all DBMS_OUTPUT lines
                line_var = cursor.var(str)
                status_var = cursor.var(int)
                while True:
                    cursor.callproc("dbms_output.get_line", (line_var, status_var))
                    if status_var.getvalue() != 0:
                        break
                    line = line_var.getvalue()
                    if line is not None:
                        # Parse line with format 'col: value' (handle variable spaces after colon)
                        try:
                            col, value = re.split(r':\s+', line, maxsplit=1)
                            if col not in columns:  # Keep order of appearance
                                columns.append(col)
                            if value == 'NULL':
                                value = '<<NULL>>'
                            elif value == '':
                                value = '<<NULL>>'
                            else:
                                value = value.replace(',', '\\,').replace('\n', ' ').replace('\r', ' ')
                            row_data[col] = value
                            row_count += 1
                        except ValueError:
                            log.warning(f"Skipping invalid DBMS_OUTPUT line: {line}")
                            continue

                if columns:
                    # Write headers (in order of appearance)
                    headers = columns
                    csvfile.write(','.join(headers) + '\n')

                    # Write single row
                    row = []
                    for col in headers:
                        value = row_data.get(col, '<<NULL>>')
                        row.append(value)
                    batch.append(','.join(row))
                    csvfile.write('\n'.join(batch) + '\n')
                    log.info(f"Wrote {filename} with 1 record")
                else:
                    log.warning(f"No valid DBMS_OUTPUT data found for {name}!")
                    return False, f"No valid DBMS_OUTPUT data found for {name}!"

        elapsed_time = time.time() - start_time
        log.info(f"Wrote {filename} with {row_count} records in {elapsed_time:.3f} seconds")
        return True, full_path

    except Exception as e:
        log.error(f"Failed to export {name} data: {str(e)}")
        return False, f"Failed to export {name} data: {str(e)}"


def format_query_results(cursor_results, cursor=None, name=''):
    """
    Format database cursor results for CSV export

    Parameters:
    cursor_results - The results from cursor.fetchall()
    cursor - Optional database cursor to extract column names

    Returns:
    tuple - (data, headers) where data is a list of rows and headers is a list of column names
    """
    start_time = time.time()
    # Process the data
    data = []
    for row in cursor_results:
        # Convert any non-string types to strings to ensure they can be written to CSV
        processed_row = []
        for item in row:
            if item is None:
                processed_row.append("")
            else:
                processed_row.append(str(item))
        data.append(processed_row)

    # Extract headers if cursor is provided and has description
    headers = None
    if cursor and hasattr(cursor, 'description'):
        headers = [str(col[0]).lower() for col in cursor.description]

    elapsed_time = time.time() - start_time
    log.info(f"Format {name} query results in {elapsed_time:.3f} seconds")
    return data, headers
