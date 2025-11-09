/* eslint-disable @typescript-eslint/no-explicit-any */
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const randomString = (length: number = 10): string => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const screenshot = async (ctx: any, save: boolean = true) => {
  if (save) {
    const time = new Date();
    const fileName = formatDatetimeString(time);
    const workDir = ctx?.settings?.workDir;

    const response = await (window as any).pywebview.api.save_screenshot(
      workDir,
      fileName
    );
    alert(response);

    await new Promise((resolve) => setTimeout(resolve, 100));
    return;
  }
};

const withTimeout = (
  promise: Promise<any>,
  timeout: number = 1000000000000
) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeout)
    ),
  ]);
};

const formatDatetimeString = (time: Date, delimiter: boolean = false) => {
  const yyyy = time.getFullYear().toString();
  const mm = (time.getMonth() + 1).toString().padStart(2, "0");
  const dd = time.getDate().toString().padStart(2, "0");
  const hh = time.getHours().toString().padStart(2, "0");
  const min = time.getMinutes().toString().padStart(2, "0");
  const ss = time.getSeconds().toString().padStart(2, "0");
  if (delimiter) return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(",")[1];
      resolve(base64 || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getStatusText = (statusCode: number): string => {
  switch (statusCode) {
    case 100:
      return "Continue";
    case 101:
      return "Switching Protocols";
    case 102:
      return "Processing";
    case 200:
      return "OK";
    case 201:
      return "Created";
    case 202:
      return "Accepted";
    case 203:
      return "Non-Authoritative Information";
    case 204:
      return "No Content";
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 405:
      return "Method Not Allowed";
    case 408:
      return "Request Timeout";
    case 500:
      return "Internal Server Error";
    case 501:
      return "Not Implemented";
    case 502:
      return "Bad Gateway";
    case 503:
      return "Service Unavailable";
    case 504:
      return "Gateway Timeout";
    case -1:
      return "Unknown Error"; // For cases where status code is -1
    default:
      return "Unknown";
  }
};

const getStatusColorClass = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300)
    return "bg-green-100 text-green-800";
  if (statusCode >= 300 && statusCode < 400)
    return "bg-yellow-100 text-yellow-800";
  if (statusCode >= 400 && statusCode < 500) return "bg-red-100 text-red-800";
  if (statusCode >= 500 || statusCode == -1) return "bg-red-200 text-red-900";
  return "bg-gray-100 text-gray-600";
};

const formatStatus = (statusCode: number): string => {
  const statusText = getStatusText(statusCode);
  return statusCode != -1 ? `${statusCode} ${statusText}` : statusText;
};

export {
  debounce,
  withTimeout,
  blobToBase64,
  formatDatetimeString,
  getStatusText,
  getStatusColorClass,
  formatStatus,
  screenshot,
  randomString,
};
