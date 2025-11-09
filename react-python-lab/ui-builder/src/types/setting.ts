interface SettingsType {
  // common
  workDir: string;
  winmergePath: string;
  autoOpenWinmerge: boolean;
  autoConnect: boolean;

  // api testing
  oracleBaseUrl: string;
  postgreBaseUrl: string;
  onpremiseBaseUrl: string;
  onpremiseIp: string;
  callTimeoutMs: number;

  // capture data full diff
  databaseDiffWs: string;
  userDiff: string;
  showDatetimeCols: boolean;

  // logs
  leftLogPanelUrl: string;
  rightLogPanelUrl: string;

  // change event timeline
  originalDatabaseDiffUrl: string;
  originalUserDiff: string;

  // query diff
  oracleConnection: string;
  postgreConnection: string;
  onpremiseConnection: string;

  // other
  queueWs?: string;
}

export type { SettingsType };
