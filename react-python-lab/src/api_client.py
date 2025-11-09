import requests
import time
from typing import Dict, Any, Optional
import json


class APIClient:
    def __init__(self, headers: Optional[Dict[str, str]] = None):
        """Khởi tạo API Client với URL cơ sở và headers tùy chọn."""
        self.headers = headers or {
            'User-Agent': 'Mozilla/5.0 (compatible; APIClient/1.0; +https://example.com)',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
        }
        self.session = requests.Session()

    def make_request(
        self,
        url: str,
        method: str = 'GET',
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        content_type: Optional[str] = 'application/json'
    ) -> Dict[str, Any]:
        """
        Thực hiện yêu cầu API và trả về thông tin chi tiết về phản hồi.

        Args:
            endpoint (str): Đường dẫn endpoint (không bao gồm base_url).
            method (str): Phương thức HTTP (GET, POST, PUT, DELETE, v.v.).
            params (dict, optional): Tham số query.
            data (dict, optional): Dữ liệu gửi dưới dạng form.
            json_data (dict, optional): Dữ liệu gửi dưới dạng JSON.
            files (dict, optional): File để gửi dưới dạng multipart/form-data.
            content_type (str, optional): Loại Content-Type (application/json, application/x-www-form-urlencoded, multipart/form-data).

        Returns:
            dict: Thông tin về yêu cầu và phản hồi.
        """
        # Chuẩn bị URL và headers
        headers = self.headers.copy()

        # Thiết lập Content-Type
        if method.upper() in ['POST', 'PUT', 'PATCH'] and content_type:
            headers['Content-Type'] = content_type

        # Ghi lại thời gian bắt đầu
        start_time = time.time()

        try:
            # Thực hiện yêu cầu
            response = self.session.request(
                method=method.upper(),
                url=url,
                params=params,
                data=data,
                json=json_data if json_data is not None and json_data != '' else None,
                files=files,
                headers=headers
            )

            # Tính thời gian phản hồi
            elapsed_time = time.time() - start_time

            # Lấy nội dung phản hồi
            try:
                response_content = response.json()
            except ValueError:
                try:
                    response_content = response.content.decode('utf-8', errors='replace')
                except (UnicodeDecodeError, AttributeError):
                    response_content = response.text

            # Tạo dictionary chứa thông tin phản hồi
            response_info = {
                'status_code': response.status_code,
                'response_time': elapsed_time,
                'headers': dict(response.headers),
                'content': response_content,
                'url': response.url,
                'method': method.upper(),
                'request_headers': headers,
                'request_params': params,
                'request_body': json_data or data,
                'request_files': files,
                'ok': response.ok,
                'reason': response.reason
            }

            return response_info

        except requests.exceptions.RequestException as e:
            # Xử lý lỗi
            return {
                'status_code': None,
                'response_time': time.time() - start_time,
                'headers': {},
                'content': str(e),
                'url': url,
                'method': method.upper(),
                'request_headers': headers,
                'request_params': params,
                'request_body': json_data or data,
                'request_files': files,
                'ok': False,
                'reason': 'Request failed',
                'error': str(e)
            }

    def close(self):
        """Đóng session để giải phóng tài nguyên."""
        self.session.close()


def call(
    url: str,
    method: str,
    data: dict | str = None,
    content_type: str = "application/json",
    header: dict = {
        'User-Agent': 'ORA2PG_Toolpack/7.42.0',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    }
) -> dict:
    """
    Gọi API với các tham số được cung cấp và trả về thông tin phản hồi.

    Args:
        url (str): URL cơ sở của API.
        method (str): Phương thức HTTP (GET, POST, PUT, DELETE, v.v.).
        data (str): Dữ liệu gửi đi, là chuỗi tham số query cho GET hoặc body cho các phương thức khác.
        content_type (str, optional): Loại Content-Type cho yêu cầu (mặc định: "application/json").
        header (dict, optional): Dictionary chứa các header HTTP, mặc định mô phỏng Postman.

    Returns:
        dict: Dictionary chứa thông tin phản hồi bao gồm:
            - status_code: Mã trạng thái HTTP.
            - response_time: Thời gian phản hồi (giây).
            - headers: Headers của phản hồi.
            - content: Nội dung phản hồi (JSON hoặc text).
            - url: URL đầy đủ của yêu cầu.
            - method: Phương thức HTTP đã sử dụng.
            - request_headers: Headers của yêu cầu.
            - request_params: Tham số query (nếu có).
            - request_body: Body của yêu cầu (nếu có).
            - ok: Trạng thái thành công (True/False).
            - reason: Lý do nếu có lỗi.
            - error: Chi tiết lỗi (nếu có).
    """
    client = APIClient(
        headers=header
    )

    try:
        if method == "GET":
            response_info = client.make_request(
                url,
                method="GET",
                params=data
            )
        else:
            if content_type == "application/json":
                response_info = client.make_request(
                    url,
                    method=method,
                    json_data=data,
                    content_type=content_type
                )
            else:
                response_info = client.make_request(
                    url,
                    method=method,
                    data=data if data is not None and data != '' else None,
                    content_type=content_type
                )
        response_info['timestamp'] = time.strftime(
            '%Y-%m-%d %H:%M:%S', time.localtime())
        client.close()
        return response_info
    except Exception as e:
        print("Error occurred:", str(e))
        return {
            'status_code': None,
            'response_time': 0,
            'headers': {},
            'content': str(e),
            'url': url,
            'method': method,
            'request_headers': header,
            'request_params': data if isinstance(data, dict) else None,
            'request_body': data if isinstance(data, str) else None,
            'request_files': None,
            'ok': False,
            'reason': 'Request failed',
            'error': str(e)
        }
