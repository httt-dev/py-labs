import os
import json
import sys
import webview
import subprocess
from PIL import Image, ImageGrab
import io
import win32clipboard  # type: ignore
import pyautogui
import time
from src.query_diff import run as run_query_diff
from src.api_client import call

class Api:
    def __init__(self, window):
        self.window = window

    def save_diff_data_files(self, folder: str, name: str, winmerge_path: str,
                             oracle_data: str, postgre_data: str, subfolder: str = "data"):

        expanded_folder = os.path.expandvars(folder)

        postgre_folder = os.path.join(expanded_folder, subfolder, "PostgreSQL")
        os.makedirs(postgre_folder, exist_ok=True)

        oracle_folder = os.path.join(expanded_folder, subfolder, "Oracle")
        os.makedirs(oracle_folder, exist_ok=True)

        postgre_path = os.path.join(
            postgre_folder, f"postgre_capture_data_{name}.json")
        oracle_path = os.path.join(
            oracle_folder,  f"oracle_capture_data_{name}.json")

        with open(oracle_path, 'w', encoding='utf-8') as f:
            json.dump(oracle_data, f, indent=2, ensure_ascii=False)

        with open(postgre_path, 'w', encoding='utf-8') as f:
            json.dump(postgre_data, f, indent=2, ensure_ascii=False)

        if winmerge_path:
            try:
                subprocess.Popen([winmerge_path, oracle_path,
                                 postgre_path], shell=False)
                return 'WinMerge launched'
            except Exception as e:
                return str(e)
        else:
            return ''

    def get_api_history(self, work_dir: str):

        expanded_work_dir = os.path.expandvars(work_dir)
        api_folder = os.path.join(expanded_work_dir, "api", "history")
        if not os.path.exists(api_folder):
            return []

        history = []
        for root, dirs, files in os.walk(api_folder):
            for file in files:
                if file.endswith('.json'):
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        history.append(data)

        return history

    def save_diff_api_files(self, folder: str, name: str, winmerge_path: str,
                            data: str, take_screenshot: bool = True, subfolder: str = "api"):

        expanded_folder = os.path.expandvars(folder)

        api_folder = os.path.join(expanded_folder, subfolder)
        os.makedirs(api_folder, exist_ok=True)
        history_folder = os.path.join(api_folder, "history", name)
        os.makedirs(history_folder, exist_ok=True)
        diff_folder = os.path.join(api_folder, "diff")
        os.makedirs(diff_folder, exist_ok=True)

        report_file_path = os.path.join(history_folder, f"api_report.json")
        if take_screenshot:
            self.save_screenshot(str(history_folder), name, "")

        with open(report_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        left_data_path = os.path.join(diff_folder, f"ORA_{name}.json")
        right_data_path = os.path.join(diff_folder, f"POSTGRE_{name}.json")

        left_data = data["oracleResponse"].get('body')
        if isinstance(left_data, str):
            try:
                left_data = json.loads(left_data)
                with open(left_data_path, 'w', encoding='utf-8') as f:
                    json.dump(left_data, f, indent=2, ensure_ascii=False)
            except json.JSONDecodeError:
                left_data = left_data.strip('"')
                with open(left_data_path, 'w', encoding='utf-8') as f:
                    f.write(left_data)

        right_data = data["postgreResponse"].get('body')
        if isinstance(right_data, str):
            try:
                right_data = json.loads(right_data)
                with open(right_data_path, 'w', encoding='utf-8') as f:
                    json.dump(right_data, f, indent=2, ensure_ascii=False)
            except json.JSONDecodeError:
                right_data = right_data.strip('"')
                with open(right_data_path, 'w', encoding='utf-8') as f:
                    f.write(right_data)

        if winmerge_path:
            try:
                subprocess.Popen([winmerge_path, left_data_path,
                                 right_data_path], shell=False)
                return 'WinMerge launched'
            except Exception as e:
                return str(e)
        else:
            return ''

    def save_screenshot(self, folder: str, name: str, subfolder: str = "screenshot", 
                       custom_offset_x: int = 4, custom_offset_y: int = 40, 
                       custom_width_adjust: int = -4, custom_height_adjust: int = -40):
        try:
            # Get window coordinates and dimensions
            x = self.window.x
            y = self.window.y
            width = self.window.width
            height = self.window.height
            
            # print(f"Raw window coordinates: ({x}, {y}), size: {width}x{height}")
            
            # Get window decoration offsets
            offsets = self.get_window_decoration_offsets()
            border_offset = offsets['border_offset']
            title_bar_height = offsets['title_bar_height']
            border_width = offsets['border_width']
            
            # Adjust coordinates to exclude shadow and decorations
            adjusted_x = x + border_offset + custom_offset_x
            adjusted_y = y + title_bar_height + border_offset + custom_offset_y
            adjusted_width = width - (2 * border_offset) - border_width + custom_width_adjust
            adjusted_height = height - title_bar_height - (2 * border_offset) - border_width + custom_height_adjust
            
            # print(f"Adjusted coordinates: ({adjusted_x}, {adjusted_y}), size: {adjusted_width}x{adjusted_height}")
            
            # Get screen size to check if coordinates are valid
            screen_width, screen_height = pyautogui.size()
            # print(f"Primary screen size: {screen_width}x{screen_height}")
            
            # Configure pyautogui
            pyautogui.FAILSAFE = False
            pyautogui.PAUSE = 0.1
            
            # Add a small delay to ensure window is ready
            time.sleep(0.2)
            
            # Try to bring window to front (optional, may help with capture)
            try:
                # Force window focus (if possible)
                self.window.on_top = True
                time.sleep(0.1)
                self.window.on_top = False
            except:
                pass  # Ignore if not supported
            
            # Handle multi-monitor setup
            # If coordinates are negative or outside primary screen, use full screen capture
            if adjusted_x < 0 or adjusted_y < 0 or adjusted_x >= screen_width or adjusted_y >= screen_height:
                # print("Window is outside primary screen, using full screen capture method")
                try:
                    # Capture full screen first
                    full_screenshot = pyautogui.screenshot()
                    
                    # Calculate actual crop area (handle negative coordinates)
                    crop_x = max(0, adjusted_x) if adjusted_x >= 0 else 0
                    crop_y = max(0, adjusted_y) if adjusted_y >= 0 else 0
                    crop_width = min(adjusted_width, full_screenshot.width - crop_x)
                    crop_height = min(adjusted_height, full_screenshot.height - crop_y)
                    
                    # If window is on secondary monitor, we need to capture all monitors
                    # Use PIL ImageGrab which supports multi-monitor
                    all_monitors = ImageGrab.grab(all_screens=True)
                    image = all_monitors.crop((adjusted_x, adjusted_y, adjusted_x + adjusted_width, adjusted_y + adjusted_height))
                    # print("Used multi-monitor capture")
                    
                except Exception as e_multi:
                    # print(f"Multi-monitor capture failed: {e_multi}")
                    # Fallback to single screen
                    full_screenshot = pyautogui.screenshot()
                    image = full_screenshot
            else:
                # Window is on primary screen, use normal region capture
                try:
                    image = pyautogui.screenshot(region=(adjusted_x, adjusted_y, adjusted_width, adjusted_height))
                    # print("Used region capture")
                except Exception as e1:
                    # print(f"Region capture failed: {e1}")
                    # Method 2: Capture full screen then crop
                    try:
                        full_screenshot = pyautogui.screenshot()
                        image = full_screenshot.crop((adjusted_x, adjusted_y, adjusted_x + adjusted_width, adjusted_y + adjusted_height))
                        # print("Used full screen + crop")
                    except Exception as e2:
                        # print(f"Full screen capture failed: {e2}")
                        return f'Screenshot failed: {e2}'
            
            # Save screenshot to file
            expanded_folder = os.path.expandvars(folder)
            screenshot_folder = os.path.join(expanded_folder, subfolder)
            os.makedirs(screenshot_folder, exist_ok=True)

            file_name = f"screenshot_{name}.png"
            file_path = os.path.join(screenshot_folder, file_name)
            image.save(file_path, "PNG")

            # Convert to BMP format for clipboard
            output = io.BytesIO()
            image.convert("RGB").save(output, "BMP")
            data_bmp = output.getvalue()[14:]

            # Copy to clipboard
            win32clipboard.OpenClipboard()
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data_bmp)
            win32clipboard.CloseClipboard()
            return 'Screenshot saved and copied to clipboard'

        except Exception as e:
            return str(e)

    def call_api(
        self,
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
    ):
        result = call(url, method, data, content_type, header)
        # # print(url)
        # # print(data)
        return result

    def query_diff(self, left_conn_string, left_query, right_conn_string, right_query, work_dir, winmerge_path):
        result = run_query_diff(
            left_db_type="Oracle",
            left_use_conn_string="True",
            left_conn_string=left_conn_string,
            left_username="", left_password="", left_dsn="", left_host="", left_database="", left_port="",
            left_query=left_query,
            right_db_type="PostgreSQL",
            right_use_conn_string="True",
            right_conn_string=right_conn_string,
            right_username="", right_password="", right_dsn="", right_host="", right_database="", right_port="",
            right_query=right_query,
            work_dir=work_dir,
            winmerge_path=winmerge_path
        )
        return result

    def get_setting_from_command_line(self):
        # get first arg from command line
        baseUrl = sys.argv[1] if len(sys.argv) > 1 else ''
        return {
            "onpremiseBaseUrl": baseUrl,
        }

    def get_window_decoration_offsets(self):
        """Get window decoration offsets for different OS and DPI settings"""
        try:
            import platform
            import ctypes
            
            # Default values for Windows
            border_offset = 8
            title_bar_height = 32
            border_width = 2
            
            # Check if we're on Windows and get DPI scaling
            if platform.system() == "Windows":
                try:
                    # Get DPI scaling factor
                    user32 = ctypes.windll.user32
                    user32.SetProcessDPIAware()
                    
                    # Get system metrics
                    border_width = ctypes.windll.user32.GetSystemMetrics(32)  # SM_CXFRAME
                    title_bar_height = ctypes.windll.user32.GetSystemMetrics(4)  # SM_CYCAPTION
                    border_offset = ctypes.windll.user32.GetSystemMetrics(92)  # SM_CXPADDEDBORDER
                    
                    # print(f"System metrics - Border: {border_width}, Title: {title_bar_height}, Padding: {border_offset}")
                    
                except Exception as e:
                    # print(f"Could not get system metrics: {e}")
                    # Use default values
                    pass
            
            return {
                'border_offset': border_offset,
                'title_bar_height': title_bar_height, 
                'border_width': border_width
            }
            
        except Exception as e:
            # print(f"Error getting decoration offsets: {e}")
            # Return default values
            return {
                'border_offset': 8,
                'title_bar_height': 32,
                'border_width': 2
            }

def on_loaded(window):
    api = Api(window)
    window.expose(api.query_diff, api.save_diff_data_files, api.save_diff_api_files,
                  api.call_api, api.save_screenshot, api.get_api_history, api.get_setting_from_command_line)


if __name__ == '__main__':
    # develop
    # window = webview.create_window(
    #     '[DEV] ORA2PG Toolpack', 'http://localhost:5173', min_size=(800, 600))
    # webview.start(on_loaded, window, ssl=False, debug=True, private_mode=False)
    # # production
    window = webview.create_window('ORA2PG Toolpack - 1.3.9', 'views/index.html', min_size=(1200, 900), zoomable=True)
    webview.start(on_loaded, window, ssl=False, debug=False, private_mode=False)
    # webview.start(on_loaded, window, ssl=False, debug=True, private_mode=False)
