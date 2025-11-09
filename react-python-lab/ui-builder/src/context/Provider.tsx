import { useState, useEffect } from "react";
import { defaultSettings } from "../config/default";
import { AppContext } from "./appContext";
import { SettingsType } from "../types/setting";
import { getLocalStorageItem, setLocalStorageItem } from "../utils/storage";
import { objectToJsonString, parseJsonString } from "../utils/string";

enum localStorageKey {
  settings = "settings",
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title || import.meta.env.VITE_APP_NAME;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);

  useEffect(() => {
    const currentSettings = getLocalStorageItem(localStorageKey.settings);
    if (!currentSettings)
      setLocalStorageItem(
        localStorageKey.settings,
        objectToJsonString(defaultSettings)
      );
    else
      setSettings(
        {...(parseJsonString<SettingsType>(currentSettings) || defaultSettings), onpremiseConnection: defaultSettings.onpremiseConnection}
      );
  }, []);

  const setSettingCtx = (settings: SettingsType) => {
    setSettings(settings);
    setLocalStorageItem(localStorageKey.settings, objectToJsonString(settings));
  };

  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        title,
        setTitle,
        settings,
        setSettings: setSettingCtx,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
