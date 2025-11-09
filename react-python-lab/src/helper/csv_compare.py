import pandas as pd
import hashlib
import time
from src.helper.logger_helper import get_logger

log = get_logger()

chunk_size = 10000  # Process in chunks to reduce memory usage
max_diff = 10


def efficient_compare_large_csv(file1_path, file2_path):
    start_time = time.time()
    try:
        # 1. Quick file hash comparison first (fastest check)
        if get_file_hash(file1_path) == get_file_hash(file2_path):
            elapsed_time = time.time() - start_time
            return f"Files are identical (hash match). Time {elapsed_time:.3f} seconds"

        # 2. Compare row counts without loading everything (still efficient)
        row_count1 = sum(1 for _ in open(file1_path)) - 1  # Subtract header
        row_count2 = sum(1 for _ in open(file2_path)) - 1  # Subtract header

        if row_count1 != row_count2:
            elapsed_time = time.time() - start_time
            return f"Files have different row counts: {row_count1} vs {row_count2}. Time {elapsed_time:.3f} seconds"

        # 3. Check headers
        # with open(file1_path, 'r') as f1, open(file2_path, 'r') as f2:
        #     headers1 = next(csv.reader(f1))
        #     headers2 = next(csv.reader(f2))
        #
        #     if headers1 != headers2:
        #         return f"Files have different headers"

        # 4. If we need detailed differences, use chunked reading
        differences = []
        num_diff = 0

        for i, (chunk1, chunk2) in enumerate(zip(
                pd.read_csv(file1_path, chunksize=chunk_size, header=None, skiprows=1),
                pd.read_csv(file2_path, chunksize=chunk_size, header=None, skiprows=1))):

            if not chunk1.equals(chunk2):
                # Option 1: Just note differences by chunk
                # differences[f"chunk_{i}"] = "contains differences"

                # Option 2: For more details (but more processing)
                diff_rows = (chunk1 != chunk2).any(axis=1)
                for i_diff in list(chunk1.index[diff_rows]):
                    # chunk1.index[diff_rows] will have index list as index from the whole file,
                    # not restart at 0 for each chunk
                    # Example: there's a different at index 10001, the i_diff will be 10001
                    # although each chunk only have 10000 items. This make chunk1.iloc[i_diff, :] throw error
                    i_diff -= i * chunk_size
                    a = ', '.join([str(item) for item in list(chunk1.iloc[i_diff, :].values)])
                    b = ', '.join([str(item) for item in list(chunk2.iloc[i_diff, :].values)])
                    differences.append(f"Line {i * chunk_size + i_diff + 2}: \"{a}\" vs \"{b}\"")
                    num_diff += 1
                    if num_diff >= max_diff:
                        break
                if num_diff >= max_diff:
                    break

        elapsed_time = time.time() - start_time
        if differences:
            log.info(f"Files are different. Time {elapsed_time:.3f} seconds")
            return '\n'.join(differences)
        else:
            return f"Files have same content. Time {elapsed_time:.3f} seconds"
    except Exception as e:
        log.error(f"Failed to compare csv files: {str(e)}")
        return 'Failed to compare csv files!'


def get_file_hash(filename):
    """Fast hash comparison of files"""
    h = hashlib.md5()
    with open(filename, 'rb') as file:
        chunk = 0
        while chunk != b'':
            chunk = file.read(1024 * 1024)  # Read 1MB at a time
            h.update(chunk)
    return h.hexdigest()
