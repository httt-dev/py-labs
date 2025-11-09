import React, { createContext } from "react";
import type { SettingsType } from "../types/setting";

interface AppContextType {
  title: string | null;
  loading: boolean;
  settings: SettingsType;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setTitle: React.Dispatch<React.SetStateAction<string | null>>;
  setSettings: (settings: SettingsType) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
