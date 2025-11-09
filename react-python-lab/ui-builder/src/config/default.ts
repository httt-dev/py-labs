import { SettingsType } from "../types/setting";

const defaultSettings: SettingsType = {
  // common
  workDir: import.meta.env.VITE_WORK_DIR,
  winmergePath: import.meta.env.VITE_WINMERGE_PATH,
  autoOpenWinmerge:
    import.meta.env.VITE_AUTO_OPEN_WINMERGE == "true" ? true : false,
  autoConnect: import.meta.env.VITE_AUTO_CONNECT == "true" ? true : false,

  // api testing
  oracleBaseUrl: import.meta.env.VITE_ORACLE_BASE_URL,
  postgreBaseUrl: import.meta.env.VITE_POSTGRE_BASE_URL,
  onpremiseBaseUrl: import.meta.env.VITE_ONPREMISE_BASE_URL,
  onpremiseIp: import.meta.env.VITE_ONPREMISE_IP,
  callTimeoutMs: parseInt(import.meta.env.VITE_CALL_TIMEOUT_MS, 10),

  // capture data full diff
  databaseDiffWs: import.meta.env.VITE_DATABASE_DIFF_WS,
  userDiff: import.meta.env.VITE_USER_DIFF,
  showDatetimeCols:
    import.meta.env.VITE_SHOW_DATETIME_COLS == "true" ? true : false,

  // logs
  leftLogPanelUrl: import.meta.env.VITE_LEFT_LOG_PANEL_URL,
  rightLogPanelUrl: import.meta.env.VITE_RIGHT_LOG_PANEL_URL,

  // change event timeline
  originalDatabaseDiffUrl: import.meta.env.VITE_ORIGINAL_DATABASE_DIFF_URL,
  originalUserDiff: import.meta.env.VITE_ORIGINAL_USER_DIFF,

  // query diff
  oracleConnection: import.meta.env.VITE_ORACLE_CONNECTION,
  postgreConnection: import.meta.env.VITE_POSTGRE_CONNECTION,
  onpremiseConnection: import.meta.env.VITE_ONPREMISE_CONNECTION,

  // other
  queueWs: import.meta.env.VITE_QUEUE_WS,
};

export { defaultSettings };
