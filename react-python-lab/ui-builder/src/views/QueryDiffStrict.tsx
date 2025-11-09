/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState } from "react";
import Editor, { loader, Monaco, OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { debounce } from "../utils/helper";
import { getLocalStorageItem, setLocalStorageItem } from "../utils/storage";
import { useAppContext } from "../hooks/common";
import { cleanString } from "../utils/string";
import "../styles/monaco.css";

enum queryKey {
  oracle = "oracleQuery",
  postgre = "postgreQuery",
}

function maskPostgresUrl(url: string) {
  const regex =
    /^(postgres(?:ql)?):\/\/([^:]+):([^@]+)@(\d+)\.(\d+)\.(\d+)\.(\d+):(\d+)\/(.+)$/;
  const match = url.match(regex);

  if (!match) return "Invalid PostgreSQL URL format";

  const [, protocol, username, , , , ip3, ip4, , dbname] = match;

  return `${protocol}://${username}:******@***.***.${ip3}.${ip4}:****/${dbname}`;
}

export function QueryDiffStrict() {
  const ctx = useAppContext();
  const oraEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const pgEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [errors, setErrors] = useState<any>(null);
  const [oraQuery, setOraQuery] = useState<string>(
    getLocalStorageItem(queryKey.oracle) || "select 'ora2pg' cols from dual"
  );
  const [pgQuery, setPgQuery] = useState<string>(
    getLocalStorageItem(queryKey.postgre) || "select 'ora2pg' cols"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveOraQuery = useCallback(
    debounce((value: string) => {
      setLocalStorageItem(queryKey.oracle, value);
    }, 500),
    []
  );

  const savePgQuery = useCallback(
    debounce((value: string) => {
      setLocalStorageItem(queryKey.postgre, value);
    }, 500),
    []
  );

  const handleOraEditorMount: OnMount = (editor) => {
    oraEditorRef.current = editor;
    editor.setValue(oraQuery);
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      setOraQuery(cleanString(value || ""));
      saveOraQuery(cleanString(value || ""));
    });
  };

  const handlePgEditorMount: OnMount = (editor) => {
    pgEditorRef.current = editor;
    editor.setValue(pgQuery);
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      setPgQuery(cleanString(value || ""));
      savePgQuery(cleanString(value || ""));
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const oraConn = ctx?.settings?.oracleConnection;
    const oraQuery = oraEditorRef.current?.getValue();

    const pgConn = ctx?.settings?.onpremiseConnection;
    const pgQuery = pgEditorRef.current?.getValue();

    const winmergePath = ctx?.settings?.winmergePath;
    const workDir = ctx?.settings?.workDir;

    try {
      const response = await (window as any).pywebview.api.query_diff(
        oraConn,
        oraQuery,
        pgConn,
        pgQuery,
        workDir,
        winmergePath
      );
      setErrors(response);
      setIsLoading(false);
    } catch (e) {
      alert("Error: " + e);
      setIsLoading(false);
    }
  };

  loader.init().then((monaco: Monaco) => {
    monaco.editor.defineTheme("transparent", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
        "minimap.background": "#00000000",
        // 'editorGutter.background': '#00000000',
        "editor.border": "#00000000",
      },
    });
    monaco.editor.setTheme("transparent");
  });

  return (
    <>
      <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-35 text-center text-gray-200/[.5] font-semibold text-[150px] w-[1000px]">
        On premise
      </p>
      <div className="relative flex flex-col p-4 h-full">
        <div className="flex flex-row justify-between items-start mb-4">
          <div>
            <p className="text-sm">
              Oracle connection: <code>{ctx?.settings?.oracleConnection}</code>
            </p>
            <p className="text-sm">
              On-premise connection:{" "}
              <code>
                {maskPostgresUrl(ctx?.settings?.onpremiseConnection || "")}
              </code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 overflow-hidden h-[calc(100vh-160px)] divide-x">
          <div className="flex flex-col h-full">
            <p className="text-orange-400 font-semibold mb-2">Oracle</p>
            <div className="flex-grow">
              <Editor
                theme="transparent"
                value={oraQuery}
                onMount={handleOraEditorMount}
                language="sql"
                defaultValue="-- select query"
                height="100%"
                options={{
                  wordWrap: "on",
                  // Loại bỏ bất kỳ border mặc định nào từ options
                  lineNumbers: "on",
                  roundedSelection: false,
                  cursorStyle: "line",
                }}
              />
            </div>
          </div>
          <div className="flex flex-col h-full">
            <p className="text-blue-400 font-semibold mb-2">Postgre</p>
            <div className="flex-grow">
              <Editor
                theme="transparent"
                value={pgQuery}
                onMount={handlePgEditorMount}
                language="sql"
                defaultValue="-- select query"
                height="100%"
                options={{
                  wordWrap: "on",
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col" hidden={!errors}>
          <p className="font-semibold mb-2">Result</p>
          <textarea
            readOnly={true}
            className="text-gray-400 text-xs h-12"
            value={errors || ""}
          />
        </div>

        <button className="mt-4" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Executing..." : "Execute"}
        </button>
      </div>
    </>
  );
}
