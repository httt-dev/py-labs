import type { Ref } from "react";
import type { WsConnectType } from "../types/ws";

const wsConnect = (
  wsUrl: URL | string,
  cb: WsConnectType,
  ref?: Ref<WebSocket | null>
) => {
  if (!wsUrl) {
    console.warn("WebSocket URL không tồn tại.");
    return;
  }

  const ws = new WebSocket(wsUrl);
  if (ref) {
    if (typeof ref === "function") {
      ref(ws);
    } else if (typeof ref === "object" && "current" in ref) {
      ref.current = ws;
    }
  }

  ws.onopen = cb.onOpen;

  ws.onmessage = cb.onMessage;

  ws.onerror = cb.onError;

  ws.onclose = cb.onClose;
};

export { wsConnect };
