/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import { useAppContext } from "../hooks/common";
import type { WsConnectType, WsMessageEvent } from "../types/ws";
import { wsConnect } from "../utils/ws";
import { parseJsonString } from "../utils/string";
import {
  convertStringNumbers,
  lowercaseKeysArrayNested,
  removeDatetimeKeys,
} from "../utils/json";
import {
  cleanPartitionInTableName,
  clearMessages,
  getMessages,
  MessageKey,
  setMessages,
} from "../utils/message";
import { formatDatetimeString } from "../utils/helper";

export function CaptureDataFullDiff() {
  const ctx = useAppContext();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [oraLogs, setOraLogs] = useState<string[]>([]);
  const [pgLogs, setPgLogs] = useState<string[]>([]);

  const clear = useCallback(() => {
    clearMessages(() => {
      setOraLogs([]);
      setPgLogs([]);
    });
  }, []);

  // Add sorting function to match saveToLocal logic
  const sortLogMessages = useCallback((logs: string[]) => {
    return logs.sort((a, b) => {
      const [dateTimeA, tableA, actionA] = a.split(" | ");
      const [dateTimeB, tableB, actionB] = b.split(" | ");

      const tableComparison = tableA.localeCompare(tableB);
      if (tableComparison !== 0) return tableComparison;

      const actionComparison = actionA.localeCompare(actionB);
      if (actionComparison !== 0) return actionComparison;

      return new Date(dateTimeA).getTime() - new Date(dateTimeB).getTime();
    });
  }, []);

  interface RecordMesssage {
    table: string;
    create_datetime: string;
    action: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
  }

  const saveTemp = useCallback((event: MessageEvent) => {
    const oraMessages = getMessages(MessageKey.oracle);
    const pgMessages = getMessages(MessageKey.postgre);

    const message = parseJsonString<WsMessageEvent>(event.data);
    const time = new Date(Number(message?.ts_ms));
    const action =
      Object.keys(message?.before || {})?.length > 0 &&
      Object.keys(message?.after || {})?.length > 0
        ? "update"
        : !message?.before && message?.after
        ? "insert"
        : "delete";
    const sourceName = message?.source?.name;
    const table = cleanPartitionInTableName(message?.source?.table);
    const preparedMessage: RecordMesssage = {
      table: String(table).toLowerCase(),
      create_datetime: time.toISOString(),
      action: action,
      before: message?.before,
      after: message?.after,
    };

    switch (sourceName) {
      case MessageKey.postgre:
        pgMessages?.push(preparedMessage);
        setMessages(MessageKey.postgre, pgMessages);
        setPgLogs((prev) => [
          ...prev,
          `${time.toLocaleString()} | ${String(
            table
          )?.toUpperCase()} | ${String(action).toUpperCase()}`,
        ]);
        break;
      case MessageKey.oracle:
        oraMessages?.push(preparedMessage);
        setMessages(MessageKey.oracle, oraMessages);
        setOraLogs((prev) => [
          ...prev,
          `${time.toLocaleString()} | ${String(
            table
          )?.toUpperCase()} | ${String(action).toUpperCase()}`,
        ]);
        break;
    }
  }, []);

  const saveToLocal = useCallback(
    (startTime: Date) => {
      setIsConnected(false);

      const fileName = formatDatetimeString(startTime);
      const workDir = ctx?.settings?.workDir;
      const winmergePath = ctx?.settings?.winmergePath;
      const autoOpenWinmerge = ctx?.settings?.autoOpenWinmerge;
      const showDatetimeCols = ctx?.settings?.showDatetimeCols;

      let oraMessages = convertStringNumbers(
        lowercaseKeysArrayNested(getMessages(MessageKey.oracle) || [])
      );
      let pgMessages = convertStringNumbers(
        lowercaseKeysArrayNested(getMessages(MessageKey.postgre) || [])
      );

      const sortMessages = (messages: any[]) => {
        return messages.sort((a, b) => {
          const tableComparison = a.table.localeCompare(b.table);
          const actionComparison = a.action.localeCompare(b.action);
          const createDatetimeComparison =
            new Date(a.create_datetime).getTime() -
            new Date(b.create_datetime).getTime();
          return (
            tableComparison || actionComparison || createDatetimeComparison
          );
        });
      };

      oraMessages = sortMessages(oraMessages);
      pgMessages = sortMessages(pgMessages);

      if (!showDatetimeCols) {
        oraMessages = removeDatetimeKeys(oraMessages);
        pgMessages = removeDatetimeKeys(pgMessages);
      }

      try {
        (window as any).pywebview.api
          .save_diff_data_files(
            workDir,
            fileName,
            autoOpenWinmerge ? winmergePath : "",
            oraMessages,
            pgMessages
          )
          .then((response: any) => {
            if (response && response != "") console.log(response);
          });
      } catch (e) {
        alert("Error: " + e);
      }
    },
    [ctx?.settings]
  );

  const connect = useCallback(() => {
    clear();
    const startTime = new Date();
    const wsUrl = new URL(
      ctx?.settings?.userDiff || import.meta.env.VITE_USER_DIFF,
      ctx?.settings?.databaseDiffWs
    );
    if (!wsUrl) {
      console.warn("WebSocket URL không tồn tại.");
      return;
    }

    const cb: WsConnectType = {
      onOpen: () => {
        setIsConnected(true);
      },
      onMessage: saveTemp,
      onError: () => {
        alert("WebSocket error");
        // saveToLocal(startTime);
      },
      onClose: () => {
        saveToLocal(startTime);
      },
    };

    wsConnect(wsUrl, cb, wsRef);
  }, [ctx?.settings, clear, saveTemp, saveToLocal]);

  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("Manually disconnecting WebSocket...");
      wsRef.current.close();
    }
  }, [wsRef]);

  useEffect(() => {
    const autoConnect = ctx?.settings.autoConnect || false;
    if (autoConnect) {
      connect();
      return () => {
        disconnect();
      };
    }
  }, [connect, disconnect]);

  return (
    <div className="flex flex-col p-4 h-full">
      <div className="flex flex-row justify-between items-start align-start h-fit shrink-0">
        <div>
          <p className="text-sm">
            WebSocket address: <code>{ctx?.settings?.databaseDiffWs}</code>
          </p>
          <p className="text-sm">
            Target user: <code>{ctx?.settings?.userDiff}</code>
          </p>
          <p className="text-sm">
            Status:{" "}
            {isConnected ? (
              <span className="text-green-500 font-semibold">Connected</span>
            ) : (
              <span className="text-red-500 font-semibold">Disconnected</span>
            )}
          </p>
        </div>

        <div className="flex gap-2 mt-4 h-fit">
          <button onClick={clear} className="border-none">
            Clear
          </button>
          <button
            onClick={disconnect}
            hidden={!isConnected}
            className="border border-red-500 text-red-500"
          >
            Disconnect
          </button>
          <button onClick={connect} hidden={isConnected}>
            Connect
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm divide-x divide-gray-500 py-2 h-[95%] grow-0">
        <div className="flex flex-col h-full text-orange-400 pr-2 overflow-y-auto">
          <p className="font-semibold mb-2">Oracle</p>
          <div className="flex-1 overflow-y-auto bg-gray-100 p-2">
            <code className="block">
              {sortLogMessages(oraLogs).map((msg, index) => (
                <div key={`ora-log-${index}`} className="whitespace-nowrap">
                  {msg}
                </div>
              ))}
            </code>
          </div>
        </div>
        <div className="flex flex-col h-full text-blue-400 overflow-y-auto">
          <p className="font-semibold mb-2">Postgre</p>
          <div className="flex-1 bg-gray-100 p-2">
            <code className="block">
              {sortLogMessages(pgLogs).map((msg, index) => (
                <div key={`pg-log-${index}`} className="whitespace-nowrap">
                  {msg}
                </div>
              ))}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
