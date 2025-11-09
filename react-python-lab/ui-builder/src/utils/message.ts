import type { WsMessageEvent } from "../types/ws";
import { getSessionStorageItem, setSessionStorageItem } from "./storage";
import { objectToJsonString, parseJsonString } from "./string";

export enum MessageKey {
  postgre = "postgres",
  oracle = "oracle",
}

const setMessages = (type: MessageKey, messages: any) => {
  setSessionStorageItem(type, objectToJsonString(messages));
};

const getMessages = (type: MessageKey) => {
  const messsages = getSessionStorageItem(type);
  if (!messsages) setSessionStorageItem(type, objectToJsonString([]));
  return parseJsonString<WsMessageEvent[]>(messsages || "[]");
};

const clearMessages = (cb: any) => {
  setSessionStorageItem(MessageKey.oracle, objectToJsonString([]));
  setSessionStorageItem(MessageKey.postgre, objectToJsonString([]));
  if (cb) cb();
};

const cleanPartitionInTableName = (table: string): string => {
  const prefix = /_p\d+(_\d+)?$/i;
  return table.replace(prefix, "");
};

export { getMessages, setMessages, clearMessages, cleanPartitionInTableName };
