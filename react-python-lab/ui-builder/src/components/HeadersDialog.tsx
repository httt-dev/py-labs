import { useState } from "react";

interface HeadersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  headers: { [key: string]: string };
  onSave: (headers: { [key: string]: string }) => void;
}

export function HeadersDialog({ isOpen, onClose, headers, onSave }: HeadersDialogProps) {
  const [localHeaders, setLocalHeaders] = useState(headers);

  if (!isOpen) return null;

  const addHeader = () => {
    setLocalHeaders({ ...localHeaders, "": "" });
  };

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    const newHeaders = { ...localHeaders };
    if (oldKey !== newKey) {
      delete newHeaders[oldKey];
    }
    newHeaders[newKey] = value;
    setLocalHeaders(newHeaders);
  };

  const deleteHeader = (key: string) => {
    const newHeaders = { ...localHeaders };
    delete newHeaders[key];
    setLocalHeaders(newHeaders);
  };

  const handleSave = () => {
    onSave(localHeaders);
    onClose();
  };

  const commonHeaders = [
    "Authorization",
    "Accept",
    "User-Agent",
    "X-API-Key",
    "Cache-Control"
  ];

  return (
    <div className="fixed inset-0 bg-slate-800/[.4] animate-fade-in flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Configure Headers</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {Object.entries(localHeaders).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <input
                type="text"
                value={key}
                onChange={(e) => updateHeader(key, e.target.value, value)}
                placeholder="Header name"
                className="flex-1 text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                list="common-headers"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => updateHeader(key, key, e.target.value)}
                placeholder="Header value"
                className="flex-1 text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => deleteHeader(key)}
                className="text-red-500 hover:text-red-700 px-1"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <datalist id="common-headers">
          {commonHeaders.map(header => (
            <option key={header} value={header} />
          ))}
        </datalist>

        <div className="flex gap-2 mb-4">
          <button
            onClick={addHeader}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Add Header
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
