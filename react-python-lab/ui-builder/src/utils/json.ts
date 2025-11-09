/* eslint-disable @typescript-eslint/no-explicit-any */
import stripJsonComments from "strip-json-comments";
import { cleanString } from "./string";
import { cleanPartitionInTableName } from "./message";

function lowercaseKeysArrayNested<T extends Record<string, any>>(
  arr: T[]
): Record<string, any>[] {
  function lowercaseKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => lowercaseKeys(item));
    }
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.toLowerCase(),
          lowercaseKeys(value),
        ])
      );
    }
    return obj;
  }

  return arr.map((item) => lowercaseKeys(item));
}

function convertStringNumbers<T extends Record<string, any>>(
  arr: T[]
): Record<string, any>[] {
  function convertValue(value: any): any {
    if (Array.isArray(value)) {
      return value.map(convertValue);
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, convertValue(val)])
      );
    }
    if (
      typeof value === "string" &&
      !isNaN(Number(value)) &&
      !(value.length > 1 && value.startsWith("0"))
    ) {
      return Number(value);
    }
    return value;
  }

  return arr.map((item) => convertValue(item));
}

function removeDatetimeKeys<T extends Record<string, any>>(
  arr: T[]
): Record<string, any>[] {
  const keysToRemove = new Set([
    "create_datetime",
    "update_datetime",
    "delete_datetime",
  ]);

  function removeKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removeKeys);
    }
    if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([key]) => !keysToRemove.has(key.toLowerCase()))
          .map(([key, value]) => [key, removeKeys(value)])
      );
    }
    return obj;
  }

  return arr.map(removeKeys);
}

function removePartitionInTableName<T extends Record<string, any>>(
  arr: T[]
): Record<string, any>[] {
  const prefix = /_p\d+(_\d+)?$/i;
  function removePrefixInTableName(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removePrefixInTableName);
    }
    if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          typeof value === "string" && key === "table"
            ? value.replace(prefix, "")
            : cleanPartitionInTableName(String(value)),
        ])
      );
    }
    return obj;
  }
  return arr.map(removePrefixInTableName);
}

function cleanJsonString(jsonStr: string): string | null {
  const cleanStr = cleanString(jsonStr);
  const noCommentsStr = stripJsonComments(cleanStr, { whitespace: false });
  let jsonObj: any;
  try {
    jsonObj = JSON.parse(noCommentsStr);
  } catch (err) {
    console.error("Invalid JSON string:", err);
    return null;
  }
  return jsonObj;
}

const beautifyJsonp = (string: any) => {
  try {
    const match = string.match(/^callback\(([\s\S]*)\);?$/);
    if (!match) {
      return string; // Return original string if not in JSONP format
    }
    const jsonObj = JSON.parse(match[1]);
    const prettyJson = JSON.stringify(jsonObj, null, 2); // Beautify JSON
    const finalCode = `callback(${prettyJson});`;
    return finalCode;
  } catch (e) {
    try {
      let jsonObj: any;
      if (typeof string === "string") 
        jsonObj = JSON.parse(string);
      else 
        jsonObj = string; 
      const prettyJson = JSON.stringify(jsonObj, null, 2); // Beautify JSON
      return prettyJson;
    } catch (e) {
      return string; // Trả về chuỗi gốc nếu không parse được
    }
  }
};

export {
  lowercaseKeysArrayNested,
  convertStringNumbers,
  removeDatetimeKeys,
  cleanJsonString,
  beautifyJsonp,
  removePartitionInTableName,
};
