import { useCallback, useEffect } from "react";
import type { SettingsType } from "../types/setting";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router";
import { defaultSettings } from "../config/default";
import { useAppContext } from "../hooks/common";

const formNames = {
  workDir: "workDir",
  winmergePath: "winmergePath",
  autoConnect: "autoConnect",
  autoOpenWinmerge: "autoOpenWinmerge",

  databaseDiffWs: "databaseDiffWs",
  userDiff: "userDiff",
  showDatetimeCols: "showDatetimeCols",

  leftLogPanelUrl: "leftLogPanelUrl",
  rightLogPanelUrl: "rightLogPanelUrl",

  originalDatabaseDiffUrl: "originalDatabaseDiffUrl",
  originalUserDiff: "originalUserDiff",

  oracleConnection: "oracleConnection",
  postgreConnection: "postgreConnection",
  onpremiseConnection: "onpremiseConnection",

  oracleBaseUrl: "oracleBaseUrl",
  postgreBaseUrl: "postgreBaseUrl",
  callTimeoutMs: "callTimeoutMs",
  onpremiseBaseUrl: "onpremiseBaseUrl",
  onpremiseIp: "onpremiseIp",
} as const;

export function Settings() {
  const ctx = useAppContext();

  if (!ctx) {
    throw new Error(
      "Settings component must be used within AppContext Provider"
    );
  }

  const getSettingFromCommandLine = async () => {
    try {
      const response = await (window as any).pywebview.api.get_setting_from_command_line();
      if (response && typeof response === "object") {
        if (!response.onpremiseBaseUrl) {
          console.warn("onpremiseBaseUrl is not provided in command line settings");
          return;
        }
        ctx.setSettings({
          ...ctx.settings,
          onpremiseBaseUrl: response.onpremiseBaseUrl || ctx.settings.onpremiseBaseUrl,
        });
        alert(
          "Settings loaded from command line successfully. Please review and save."
        );
      } else {
        console.warn("Invalid response from command line:", response);
      }
    } catch (error) {
      console.error("Failed to get setting from command line:", error);
      return null;
    }
  };

  useEffect(() => {
    getSettingFromCommandLine();
  }, []);

  const handleSave = useCallback((formData: FormData) => {
    const newSettings: SettingsType = {
      databaseDiffWs:
        (formData.get(formNames.databaseDiffWs) as string) ||
        ctx.settings.databaseDiffWs ||
        import.meta.env.VITE_DATABASE_DIFF_WS,
      userDiff:
        (formData.get(formNames.userDiff) as string) ||
        ctx.settings.userDiff ||
        import.meta.env.VITE_USER_DIFF,
      workDir:
        (formData.get(formNames.workDir) as string) ||
        ctx.settings.workDir ||
        import.meta.env.VITE_WORK_DIR,
      winmergePath:
        (formData.get(formNames.winmergePath) as string) ||
        ctx.settings.winmergePath ||
        import.meta.env.VITE_WINMERGE_PATH,
      autoOpenWinmerge: formData.get(formNames.autoOpenWinmerge) === "on",
      autoConnect: formData.get(formNames.autoConnect) === "on",
      showDatetimeCols: formData.get(formNames.showDatetimeCols) === "on",
      leftLogPanelUrl:
        (formData.get(formNames.leftLogPanelUrl) as string) ||
        ctx.settings.leftLogPanelUrl ||
        import.meta.env.VITE_LEFT_LOG_PANEL_URL,
      rightLogPanelUrl:
        (formData.get(formNames.rightLogPanelUrl) as string) ||
        ctx.settings.rightLogPanelUrl ||
        import.meta.env.VITE_RIGHT_LOG_PANEL_URL,
      originalDatabaseDiffUrl:
        (formData.get(formNames.originalDatabaseDiffUrl) as string) ||
        ctx.settings.originalDatabaseDiffUrl ||
        import.meta.env.VITE_ORIGINAL_DATABASE_DIFF_URL,
      originalUserDiff:
        (formData.get(formNames.originalUserDiff) as string) ||
        ctx.settings.originalUserDiff ||
        import.meta.env.VITE_ORIGINAL_USER_DIFF,
      oracleConnection:
        (formData.get(formNames.oracleConnection) as string) ||
        ctx.settings.oracleConnection ||
        import.meta.env.VITE_ORACLE_CONNECTION,
      postgreConnection:
        (formData.get(formNames.postgreConnection) as string) ||
        ctx.settings.postgreConnection ||
        import.meta.env.VITE_POSTGRE_CONNECTION,
      onpremiseConnection:
        (formData.get(formNames.onpremiseConnection) as string) ||
        ctx.settings.onpremiseConnection ||
        import.meta.env.VITE_ONPREMISE_CONNECTION,
      oracleBaseUrl:
        (formData.get(formNames.oracleBaseUrl) as string) ||
        ctx.settings.oracleBaseUrl ||
        import.meta.env.VITE_ORACLE_BASE_URL,
      postgreBaseUrl:
        (formData.get(formNames.postgreBaseUrl) as string) ||
        ctx.settings.postgreBaseUrl ||
        import.meta.env.VITE_POSTGRE_BASE_URL,
      callTimeoutMs:
        parseInt(formData.get(formNames.callTimeoutMs) as string, 10) ||
        ctx.settings.callTimeoutMs ||
        import.meta.env.VITE_CALL_TIMEOUT_MS,
      onpremiseBaseUrl:
        (formData.get(formNames.onpremiseBaseUrl) as string) ||
        ctx.settings.onpremiseBaseUrl ||
        import.meta.env.VITE_ONPREMISE_BASE_URL,
      onpremiseIp:
        (formData.get(formNames.onpremiseIp) as string) ||
        ctx.settings.onpremiseIp ||
        import.meta.env.VITE_ONPREMISE_IP,
    };

    try {
      ctx.setSettings(newSettings);
      alert("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    }
  }, [ctx]);

  const handleResetSetting = useCallback(() => {
    try {
      ctx.setSettings(defaultSettings);
      alert("Settings saved successfully");
      location.reload();
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    }
  }, []);

  return (
    <div className="flex flex-col px-4 mb-4 gap-4 relative overflow-auto">
      <div className="flex gap-3  items-center align-center sticky top-0 bg-white py-2">
        <Link className="text-lg" to="/">
          <FontAwesomeIcon icon={faChevronLeft} />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          className="border-none self-end text-sm"
          onClick={handleResetSetting}
        >
          Reset all settings
        </button>
      </div>

      <form
        className="flex flex-col gap-4 h-full py-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave(new FormData(e.currentTarget));
        }}
      >
        <h2 className="text-lg font-semibold">General</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {" "}
          <div className="flex flex-col">
            <label
              htmlFor={formNames.workDir}
              className="text-sm font-medium mb-1"
            >
              Working Directory
            </label>
            <input
              type="text"
              name={formNames.workDir}
              defaultValue={ctx.settings.workDir}
              pattern="^\S+$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  "Working directory cannot contain whitespace"
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor={formNames.winmergePath}
              className="text-sm font-medium mb-1"
            >
              WinMerge Path
            </label>
            <input
              type="text"
              name={formNames.winmergePath}
              defaultValue={ctx.settings.winmergePath}
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  "WinMerge path cannot be empty"
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
          <div className="flex items-center gap-2 p-2 col-span-2">
            <input
              type="checkbox"
              id={formNames.autoOpenWinmerge}
              name={formNames.autoOpenWinmerge}
              defaultChecked={ctx.settings.autoOpenWinmerge}
              className="w-4 h-4"
            />
            <label
              htmlFor={formNames.autoOpenWinmerge}
              className="text-sm font-medium"
            >
              Auto-open WinMerge (after disconnect, query diff,..)
            </label>
          </div>
        </div>

        <div className="border-b border-gray-200 w-full mt-4" />
        <h2 className="text-lg font-semibold">API testing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label
              htmlFor={formNames.oracleBaseUrl}
              className="text-sm font-medium mb-1"
            >
              Oracle base URL
            </label>
            <input
              type="url"
              name={formNames.oracleBaseUrl}
              defaultValue={ctx.settings.oracleBaseUrl}
              pattern="^\S+$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity("Please enter a valid URL")
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor={formNames.postgreBaseUrl}
              className="text-sm font-medium mb-1"
            >
              Postgre base URL
            </label>
            <input
              type="url"
              name={formNames.postgreBaseUrl}
              defaultValue={ctx.settings.postgreBaseUrl}
              pattern="^\S+$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity("Please enter a valid URL")
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor={formNames.onpremiseBaseUrl}
              className="text-sm font-medium mb-1"
            >
              On-Premise base URL
            </label>
            <input
              type="url"
              readOnly
              name={formNames.onpremiseBaseUrl}
              value={ctx.settings.onpremiseBaseUrl}
              className="text-gray-500 border-gray-300 bg-gray-100"
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor={formNames.onpremiseIp}
              className="text-sm font-medium mb-1"
            >
              On-Premise IP
            </label>
            <input
              type="url"
              readOnly
              name={formNames.onpremiseIp}
              value={ctx.settings.onpremiseIp}
              className="text-gray-500 border-gray-300 bg-gray-100"
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor={formNames.callTimeoutMs}
              className="text-sm font-medium mb-1"
            >
              Call timeout (ms)
            </label>
            <input
              type="number"
              min="0"
              name={formNames.callTimeoutMs}
              defaultValue={ctx.settings.callTimeoutMs}
              pattern="^\S+$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  "Please enter a valid timeout in milliseconds"
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
        </div>

        <div className="border-b border-gray-200 w-full mt-4" />
        <h2 className="text-lg font-semibold">Query diff</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label
              htmlFor={formNames.oracleConnection}
              className="text-sm font-medium mb-1"
            >
              Oracle connection string
            </label>
            <input
              type="text"
              name={formNames.oracleConnection}
              defaultValue={ctx.settings.oracleConnection}
              pattern="^\S+$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  "Please enter a valid connection string"
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor={formNames.postgreConnection}
              className="text-sm font-medium mb-1"
            >
              Postgre connection string
            </label>
            <input
              type="text"
              name={formNames.postgreConnection}
              defaultValue={ctx.settings.postgreConnection}
              pattern="^\S+$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  "Please enter a valid connection string"
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
                    <div className="flex flex-col">
            <label
              htmlFor={formNames.onpremiseConnection}
              className="text-sm font-medium mb-1"
            >
              On-Premise Connection String
            </label>
            <input
              type="text"
              readOnly
              name={formNames.onpremiseConnection}
              value={ctx.settings.onpremiseConnection}
              className="text-gray-500 border-gray-300 bg-gray-100"
              required
            />
          </div>
        </div>

        <div className="border-b border-gray-200 w-full mt-4" />
        <h2 className="text-lg font-semibold">Capture data with full diff</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label
              htmlFor={formNames.databaseDiffWs}
              className="text-sm font-medium mb-1"
            >
              WebSocket Address
            </label>
            <input
              type="url"
              name={formNames.databaseDiffWs}
              defaultValue={ctx.settings.databaseDiffWs}
              pattern="^(ws|wss):\/\/[a-zA-Z0-9.-]+(:[0-9]+)?(\/.*)?$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  "Please enter a valid WebSocket address (ws:// or wss://)"
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor={formNames.userDiff}
              className="text-sm font-medium mb-1"
            >
              Target User
            </label>
            <input
              type="text"
              name={formNames.userDiff}
              defaultValue={ctx.settings.userDiff}
              pattern="^\S+$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  "Target user cannot contain whitespace"
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>

          <div className="flex items-center gap-2 p-2">
            <input
              type="checkbox"
              id={formNames.autoConnect}
              name={formNames.autoConnect}
              defaultChecked={ctx.settings.autoConnect}
              className="w-4 h-4"
            />
            <label
              htmlFor={formNames.autoConnect}
              className="text-sm font-medium"
            >
              Auto-connect to WebSocket
            </label>
          </div>

          <div className="flex items-center gap-2 p-2">
            <input
              type="checkbox"
              id={formNames.showDatetimeCols}
              name={formNames.showDatetimeCols}
              defaultChecked={ctx.settings.showDatetimeCols}
              className="w-4 h-4"
            />
            <label
              htmlFor={formNames.showDatetimeCols}
              className="text-sm font-medium"
            >
              Show datatime columns?
            </label>
          </div>
        </div>

        <div className="border-b border-gray-200 w-full mt-4" />
        <h2 className="text-lg font-semibold">Change event timeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label
              htmlFor={formNames.originalDatabaseDiffUrl}
              className="text-sm font-medium mb-1"
            >
              Base URL
            </label>
            <input
              type="url"
              name={formNames.originalDatabaseDiffUrl}
              defaultValue={ctx.settings.originalDatabaseDiffUrl}
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity("Please enter a valid URL")
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor={formNames.originalUserDiff}
              className="text-sm font-medium mb-1"
            >
              Target User
            </label>
            <input
              type="text"
              name={formNames.originalUserDiff}
              defaultValue={ctx.settings.originalUserDiff}
              pattern="^\S+$"
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  "Target user cannot contain whitespace"
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
        </div>

        <div className="border-b border-gray-200 w-full mt-4" />
        <h2 className="text-lg font-semibold">Logs viewer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label
              htmlFor={formNames.leftLogPanelUrl}
              className="text-sm font-medium mb-1"
            >
              Oracle log viewer URL
            </label>
            <input
              type="url"
              name={formNames.leftLogPanelUrl}
              defaultValue={ctx.settings.leftLogPanelUrl}
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity("Please enter a valid URL")
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor={formNames.rightLogPanelUrl}
              className="text-sm font-medium mb-1"
            >
              Postgre log viewer URL
            </label>
            <input
              type="url"
              name={formNames.rightLogPanelUrl}
              defaultValue={ctx.settings.rightLogPanelUrl}
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity("Please enter a valid URL")
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </div>
        </div>

        <button type="submit" className="mt-4">
          Save Settings
        </button>
      </form>
    </div>
  );
}
