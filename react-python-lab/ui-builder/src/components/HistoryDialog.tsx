import { useState } from "react";
import { TestHistory } from "../types/api";
interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  history: TestHistory[];
  onLoadTest: (test: TestHistory) => void;
  onClearHistory: () => void;
}

export function HistoryDialog({
  isOpen,
  onClose,
  history,
  onLoadTest,
  onClearHistory,
}: HistoryDialogProps) {
  const [selectedTest, setSelectedTest] = useState<TestHistory | null>(null);

  if (!isOpen) return null;

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return "bg-gray-100 text-gray-600";
    if (statusCode >= 200 && statusCode < 300)
      return "bg-green-100 text-green-800";
    if (statusCode >= 400) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="fixed inset-0 bg-slate-800/[.4] animate-fade-in flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] h-[600px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <h3 className="text-lg font-semibold">Test History</h3>
            <button
              onClick={onClearHistory}
              className="px-3 py-1 text-red-500 border-none text-sm hidden"
            >
              Clear All
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 border-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 gap-4 w-full h-full overflow-hidden">
          {/* History List */}
          <div className="w-1/2 border-r pr-1">
            <div className="space-y-2 max-h-full overflow-y-auto pr-2">
              {history
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((test) => (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className={`flex flex-col p-2 border rounded cursor-pointer hover:bg-gray-50 gap-2 ${
                    selectedTest?.id === test.id
                      ? "border-blue-500 bg-blue-50"
                      : ""
                  }`}
                >
                  <span className="text-xs text-gray-500">
                    {test.timestamp}
                  </span>
                  <div className="flex justify-between items-start break-all">
                    <span className="font-medium text-sm">
                      {test.request.method} {test.request.path}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded ${getStatusColor(
                        test.oracleResponse?.statusCode
                      )}`}
                    >
                      Oracle: {test.oracleResponse?.statusCode || "N/A"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded ${getStatusColor(
                        test.postgreResponse?.statusCode
                      )}`}
                    >
                      Postgre: {test.postgreResponse?.statusCode || "N/A"}
                    </span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No test history available
                </p>
              )}
            </div>
          </div>

          {/* Test Details */}
          <div className="w-1/2 shrink-0 h-full overflow-y-auto pl-2 pr-2">
            {selectedTest ? (
              <div className="flex flex-col space-y-4 w-full h-full">
                <div>
                  <h4 className="font-semibold mb-2">Request Details</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Method:</span>{" "}
                      {selectedTest.request.method}
                    </p>
                    <p className="break-all">
                      <span className="font-medium">Path:</span>{" "}
                      {selectedTest.request.path}
                    </p>
                    <p className="break-all">
                      <span className="font-medium">Oracle:</span>{" "}
                      {selectedTest.request.oracleEndpoint}
                    </p>
                    <p className="break-all">
                      <span className="font-medium">Postgre:</span>{" "}
                      {selectedTest.request.postgreEndpoint}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Request Body</h4>
                  <textarea
                    value={selectedTest.request.oracleBody}
                    readOnly
                    className="w-full h-24 text-xs border rounded p-2 bg-gray-50 font-mono resize-none"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Oracle:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          selectedTest.oracleResponse?.statusCode
                        )}`}
                      >
                        {selectedTest.oracleResponse?.statusCode || "N/A"} (
                        {selectedTest.oracleResponse?.responseTime || 0}ms)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>PostgreSQL:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          selectedTest.postgreResponse?.statusCode
                        )}`}
                      >
                        {selectedTest.postgreResponse?.statusCode || "N/A"} (
                        {selectedTest.postgreResponse?.responseTime || 0}ms)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onLoadTest(selectedTest);
                      onClose();
                    }}
                    className="rounded w-full"
                  >
                    Load Test
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Select a test to view details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
