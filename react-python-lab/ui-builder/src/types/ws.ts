interface WsConnectType {
  onOpen: () => any;
  onMessage: (event: MessageEvent) => any;
  onError: (event: Event) => any;
  onClose: () => any;
}

interface WsMessageEvent {
  before?: Record<string, any>;
  after?: Record<string, any>;
  source?: Record<string, any>;
  transaction?: {
    id: string;
    total_order: number;
    data_collection_order: number;
  };
  op?: string;
  ts_ms?: number;
  ts_us?: number;
  ts_ns?: number;
  table?: string;
  time?: string;
}

export type { WsConnectType, WsMessageEvent };
