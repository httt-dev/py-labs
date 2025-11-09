/* eslint-disable @typescript-eslint/no-explicit-any */
import { Editor, loader, Monaco } from "@monaco-editor/react";
import { useState, useEffect, useCallback } from "react";
import { ApiResponse, TestHistory } from "../types/api";
import { HeadersDialog } from "../components/HeadersDialog";
import { HistoryDialog } from "../components/HistoryDialog";
import {
  formatStatus,
  formatDatetimeString,
  getStatusColorClass,
  getStatusText,
  // screenshot,
  withTimeout,
} from "../utils/helper";
import { beautifyJsonp, cleanJsonString } from "../utils/json";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useAppContext } from "../hooks/common";
import { cleanString } from "../utils/string";
import "../styles/monaco.css";
import LoadingDialog from "../components/LoadingDialog";

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

loader.config({ monaco });

export function ApiTestingStrict() {
  const ctx = useAppContext();
  const oracleBaseUrl = ctx?.settings?.oracleBaseUrl?.replace(/\/+$/, "");
  const postgreBaseUrl = ctx?.settings?.onpremiseBaseUrl?.replace(/\/+$/, "");
  const workDir = ctx?.settings?.workDir;
  const winmergePath = ctx?.settings?.winmergePath;

  const [autoOpenWinmerge, setAutoOpenWinmerge] = useState(
    ctx?.settings?.autoOpenWinmerge || false
  );
  const [timeoutMs, setTimeoutMs] = useState(
    ctx?.settings?.callTimeoutMs || 60000
  );
  const [method, setMethod] = useState("POST");
  const [apiPath, setApiPath] = useState("");
  const [oracleEndpoint, setOracleEndpoint] = useState(oracleBaseUrl);
  const [postgreEndpoint, setPostgreEndpoint] = useState(postgreBaseUrl);
  const [bodyType, setBodyType] = useState("application/json");
  const [oracleBody, setOracleBody] = useState(`{
  "userId": "86000017",
  "connIp": "172.20.1.36",
  "userAgent": "Mozilla/5.0 (Windows NT 6.1; rv:34.0) Gecko/20100101 Firefox/34.0",
  "pageUri": "http://103.4.42.139/botest/index.php"
}`);
  const [postgreBody, setPostgreBody] = useState(`{
  "userId": "86000017",
  "connIp": "172.20.1.36",
  "userAgent": "Mozilla/5.0 (Windows NT 6.1; rv:34.0) Gecko/20100101 Firefox/34.0",
  "pageUri": "http://103.4.42.139/botest/index.php"
}`);
  const [oracleResponse, setOracleResponse] = useState("");
  const [postgreResponse, setPostgreResponse] = useState("");
  const [oracleStatus, setOracleStatus] = useState<ApiResponse | null>(null);
  const [postgreStatus, setPostgreStatus] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dualInputMode, setDualInputMode] = useState(false);
  const [headers, setHeaders] = useState<{ [key: string]: string }>({});
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [showHeadersDialog, setShowHeadersDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  loader.init().then((monaco: Monaco) => {
    monaco.editor.defineTheme("transparent", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
        'minimap.background': '#00000000',
        // 'editorGutter.background': '#00000000',
      },
    });
    monaco.editor.setTheme("transparent");
  });

    useEffect(() => {
    const normalizedApiPath = apiPath.startsWith("/")
      ? apiPath.slice(1)
      : apiPath;
    const encodedPath = normalizedApiPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    setOracleEndpoint(
      oracleBaseUrl ? `${oracleBaseUrl}/${encodedPath}` : oracleBaseUrl
    );
    setPostgreEndpoint(
      postgreBaseUrl ? `${postgreBaseUrl}/${encodedPath}` : postgreBaseUrl
    );
    // replace encoded query params characters (?, = and &) with their original characters
    setOracleEndpoint((prev) =>
      prev?.replace(/%3F/g, "?").replace(/%3D/g, "=").replace(/%26/g, "&")
    );
    setPostgreEndpoint((prev) =>
      prev?.replace(/%3F/g, "?").replace(/%3D/g, "=").replace(/%26/g, "&")
    );
  }, [apiPath, oracleBaseUrl, postgreBaseUrl]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await (window as any).pywebview.api.get_api_history(
        workDir
      );
      setTestHistory(response);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
    setIsLoading(false);
  };

  const cleanRequestBody = (body: string): string => {
    if (bodyType === "application/json") {
      try {
        const cleanedBody = cleanJsonString(body);
        if (!cleanedBody) {
          alert("Invalid JSON format in request body");
          return body;
        }
        return cleanedBody;
      } catch (error) {
        alert("Invalid JSON format in request body");
        console.error("JSON parse error:", error);
        throw new Error("Invalid JSON format in request body");
      }
    }
    return body;
  };

const callOracleApi = async () => {
    const preparedBody = cleanRequestBody(oracleBody);
    try {
      const response = await (window as any).pywebview.api.call_api(
        oracleEndpoint,
        method,
        preparedBody,
        bodyType,
        headers
      );
      return {
        status: {
          statusCode: response.status_code || -1,
          responseTime: Math.round((response.response_time || 0) * 1000),
          headers: response.headers,
          body: response.request_body,
          statusText: getStatusText(response.status_code),
        },
        content: response.content,
      };
    } catch (error) {
      alert("An error occurred while calling the Oracle API");
      console.error("Error calling Oracle API:", error);
      return null;
    }
  };

  const callPostgreApi = async () => {
    let preparedBody = cleanRequestBody(postgreBody);
    try {
      const response = await (window as any).pywebview.api.call_api(
        postgreEndpoint,
        method,
        preparedBody,
        bodyType,
        headers
      );
      return {
        status: {
          statusCode: response.status_code || -1,
          responseTime: Math.round((response.response_time || 0) * 1000),
          headers: response.headers,
          body: response.request_body,
          statusText: getStatusText(response.status_code),
        },
        content: response.content,
      };
    } catch (error) {
      alert("An error occurred while calling the PostgreSQL API");
      console.error("Error calling PostgreSQL API:", error);
      return null;
    }
  };

  const saveDiffApiFiles = useCallback(
    async (testRecord: TestHistory) => {
      const name = `${(testRecord.request?.path
        ? `${
            testRecord.request?.path?.startsWith("/")
              ? testRecord.request?.path?.slice(1).replace("/", "_")
              : testRecord.request?.path?.replace("/", "_")
          }_`
        : ""
      ).replace(/[?=&]/g, "_")}${formatDatetimeString(
        new Date(testRecord.timestamp),
        false
      )}`;
      try {
        const response = await (
          window as any
        ).pywebview.api.save_diff_api_files(
          workDir,
          name,
          autoOpenWinmerge ? winmergePath : "",
          testRecord,
          true
        );
        if (response) console.log(response);
      } catch (error) {
        alert("An error occurred while save and diff responses");
        console.error("Error saving and diffing responses:", error);
      }
    },
    [autoOpenWinmerge, winmergePath, workDir, ctx]
  );

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setOracleResponse("");
    setPostgreResponse("");
    setOracleStatus(null);
    setPostgreStatus(null);

    try {
      const testRecord: TestHistory = {
        id: Date.now().toString(),
        timestamp: formatDatetimeString(new Date(), true),
        request: {
          method,
          path: apiPath,
          oracleEndpoint: oracleEndpoint || "",
          postgreEndpoint: postgreEndpoint || "",
          headers,
          bodyType,
          oracleBody: oracleBody,
          postgreBody: postgreBody,
        },
      };
      // Tối ưu: chỉ setState sau khi nhận cả hai response
      const [oracleResult, postgreResult] = await Promise.all([
        withTimeout(callOracleApi(), timeoutMs),
        withTimeout(callPostgreApi(), timeoutMs),
      ]);
      setIsLoading(false);
      if (oracleResult) {
        setOracleStatus(oracleResult.status);
        setOracleResponse(oracleResult.content);
        testRecord.oracleResponse = {
          ...oracleResult.status,
          body: oracleResult.content ? beautifyJsonp(oracleResult.content) : "",
        };
      }
      if (postgreResult) {
        setPostgreStatus(postgreResult.status);
        setPostgreResponse(postgreResult.content);
        testRecord.postgreResponse = {
          ...postgreResult.status,
          body: postgreResult.content ? beautifyJsonp(postgreResult.content) : "",
        };
      }
      await saveDiffApiFiles(testRecord);
    } catch (error: Error | any) {
      setIsLoading(false);
      console.error("Error running tests:", error);
      alert(error?.message || "An error occurred while running the tests");
    }
  }, [
    timeoutMs,
    method,
    apiPath,
    oracleEndpoint,
    postgreEndpoint,
    headers,
    bodyType,
    oracleBody,
    postgreBody,
    dualInputMode,
    saveDiffApiFiles,
    loadHistory,
    callOracleApi,
    callPostgreApi,
  ]);

  const handleHeaders = () => {
    setShowHeadersDialog(true);
  };

  const handleHistory = async () => {
    await loadHistory();
    setShowHistoryDialog(true);
  };

  const handleSwitchMode = () => {
    setDualInputMode(!dualInputMode);
    if (!dualInputMode) {
      setPostgreBody(oracleBody);
    }
  };

  const handleLoadTest = (test: TestHistory) => {
    setMethod(test.request.method);
    setApiPath(test.request.path);
    setOracleEndpoint(test.request.oracleEndpoint);
    setPostgreEndpoint(test.request.postgreEndpoint);
    setHeaders(test.request.headers);
    setBodyType(test.request.bodyType);
    setOracleBody(test.request.oracleBody);
    setPostgreBody(test.request.postgreBody);
  };

  const handleClear = () => {
    setOracleResponse("");
    setPostgreResponse("");
    setOracleStatus(null);
    setPostgreStatus(null);
    setIsLoading(false);
  };

  return (
    <>
      <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-35 text-center text-gray-200/[.5] font-semibold text-[150px] w-[800px]">
        On premise
      </p>
      <div className="relative flex flex-col w-full h-full overflow-hidden px-4 pt-4 gap-2 z-10">
        {/* API Path Section */}
        <div className="flex flex-col gap-2 ">
          <p className="text-sm font-semibold">API Endpoint</p>
          <div className="flex flex-row items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-24 text-sm focus:outline-none bg-gray-100 rounded-lg border px-2 py-1"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              value={apiPath}
              onChange={(e) => setApiPath(e.target.value)}
              className="flex-1 text-sm border rounded-lg px-3 py-1 focus:outline-none"
              placeholder="Enter API path (e.g., /api/users)"
            />
            <button
              onClick={handleRun}
              disabled={isLoading}
              className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:cursor-not-allowed"
            >
              Run
            </button>
          </div>
        </div>

        {/* Endpoints Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-orange-500">
              Oracle Endpoint
            </label>
            <input
              type="text"
              value={oracleEndpoint}
              onChange={(e) => setOracleEndpoint(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1 focus:outline-none"
              placeholder="Oracle base URL"
              readOnly
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-blue-500">
              PostgreSQL Endpoint
            </label>
            <input
              type="text"
              value={postgreEndpoint}
              onChange={(e) => setPostgreEndpoint(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1 focus:outline-none"
              placeholder="PostgreSQL base URL"
              readOnly
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-row items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm">Body Type:</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="text-sm focus:outline-none bg-gray-100 rounded-lg border px-2 py-1"
            >
              <option value="application/json">application/json</option>
              <option value="application/xml">application/xml</option>
              <option value="text/plain">text/plain</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Timeout:</label>
            <input
              type="number"
              value={timeoutMs / 1000}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= 300) {
                  setTimeoutMs(value * 1000);
                  ctx?.setSettings({
                    ...ctx?.settings,
                    callTimeoutMs: value * 1000,
                  });
                }
              }}
              className="w-16 text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              step="1"
            />
            <span className="text-sm text-gray-500">sec</span>
          </div>
          <button
            onClick={handleHeaders}
            className="text-sm border-none underline"
          >
            Headers
          </button>
          <button
            onClick={handleHistory}
            className="text-sm border-none underline"
          >
            History
          </button>
          <button
            onClick={handleSwitchMode}
            className="text-sm border-none underline"
          >
            {dualInputMode ? "Single Mode" : "Dual Mode"}
          </button>
          <div className="flex items-center gap-2 cursor-pointer w-48">
            <input
              id="auto-open-winmerge"
              type="checkbox"
              checked={autoOpenWinmerge}
              onChange={(e) => {
                setAutoOpenWinmerge(e.target.checked);
                ctx?.setSettings({
                  ...ctx?.settings,
                  autoOpenWinmerge: e.target.checked,
                });
              }}
              className="grow-0 h-4 w-4"
            />
            <label
              htmlFor="auto-open-winmerge"
              className="text-sm w-full cursor-pointer"
            >
              Auto open WinMerge
            </label>
          </div>
        </div>

        <Allotment vertical={true}>
          <Allotment.Pane key="request-pane" snap>
            {/* Request Body Section */}
            <div className="flex flex-col gap-2 h-full">
              <p className="text-sm font-semibold">Request Body</p>
              {dualInputMode ? (
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="flex flex-col gap-2 h-full">
                    <p className="text-orange-500 text-sm font-medium">
                      Oracle
                    </p>
                    <Editor theme="transparent"
                      language="json"
                      value={oracleBody}
                      onChange={(value) =>
                        setOracleBody(cleanString(value || ""))
                      }
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        fontSize: 13,
                        renderValidationDecorations: "off",
                      }}
                      className="monaco-editor-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-2 h-full">
                    <p className="text-blue-500 text-sm font-medium">
                      PostgreSQL
                    </p>
                    <Editor theme="transparent"
                      language="json"
                      value={postgreBody}
                      onChange={(value) => {
                        setPostgreBody(cleanString(value || ""));
                      }}
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        fontSize: 13,
                        renderValidationDecorations: "off",
                      }}
                      className="monaco-editor-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 h-full">
                  <Editor theme="transparent"
                    language="json"
                    value={oracleBody}
                    onChange={(value) => {
                      setOracleBody(cleanString(value || ""));
                      setPostgreBody(cleanString(value || ""));
                    }}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      fontSize: 13,
                      renderValidationDecorations: "off",
                    }}
                    className="monaco-editor-transparent"
                  />
                </div>
              )}
            </div>
          </Allotment.Pane>
          <Allotment.Pane key="response-pane" minSize={200} snap>
            {/* Response Section */}
            <div className="flex flex-col gap-2 flex-1 h-full mt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Response</p>
                <button
                  onClick={handleClear}
                  className="text-sm border-none underline"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1 h-full">
                <div className="flex flex-col gap-2 h-full">
                  <div className="flex items-center justify-between">
                    <p className="text-orange-500 text-sm font-medium">
                      Oracle
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded ${getStatusColorClass(
                          oracleStatus?.statusCode || 0
                        )}`}
                      >
                        {formatStatus(oracleStatus?.statusCode || 0)}
                      </span>
                      <span className="text-gray-600">
                        {oracleStatus?.responseTime || 0}ms
                      </span>
                    </div>
                  </div>
                  <Editor theme="transparent"
                    language="javascript"
                    value={beautifyJsonp(oracleResponse)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      fontSize: 13,
                      renderValidationDecorations: "off",
                    }}
                    className="monaco-editor-transparent"
                    height="90%"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full h-full">
                  <div className="flex items-center justify-between">
                    <p className="text-blue-500 text-sm font-medium">
                      PostgreSQL
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded ${getStatusColorClass(
                          postgreStatus?.statusCode || 0
                        )}`}
                      >
                        {formatStatus(postgreStatus?.statusCode || 0)}
                      </span>
                      <span className="text-gray-600">
                        {postgreStatus?.responseTime || 0}ms
                      </span>
                    </div>
                  </div>
                  <Editor theme="transparent"
                    language="javascript"
                    value={beautifyJsonp(postgreResponse)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      fontSize: 13,
                      renderValidationDecorations: "off",
                    }}
                    className="monaco-editor-transparent"
                    height="90%"
                  />
                </div>
              </div>
            </div>
          </Allotment.Pane>
        </Allotment>

        {/* Dialogs */}
        <HeadersDialog
          isOpen={showHeadersDialog}
          onClose={() => setShowHeadersDialog(false)}
          headers={headers}
          onSave={setHeaders}
        />

        <HistoryDialog
          isOpen={showHistoryDialog}
          onClose={() => setShowHistoryDialog(false)}
          history={testHistory}
          onLoadTest={handleLoadTest}
          onClearHistory={() => {}}
        />

        <LoadingDialog isOpen={isLoading} />
      </div>
    </>
  );
}
