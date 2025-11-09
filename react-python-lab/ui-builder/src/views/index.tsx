import { ApiTesting } from "./ApiTesting";
import { ApiTestingStrict } from "./ApiTestingStrict";
import { CaptureDataByRecords } from "./CaptureDataByRecords";
import { CaptureDataFullDiff } from "./CaptureDataFullDiff";
import { Logs } from "./Logs";
import { QueryDiff } from "./QueryDiff";
import { QueryDiffStrict } from "./QueryDiffStrict";
import { Settings } from "./Settings";
import {
  faClock,
  faCode,
  faDatabase,
  faGear,
  faListOl,
  faRecordVinyl,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

enum View {
  ChangeEventTimeLine = "change-event-timeline",
  CaptureDataWithFullDiff = "capture-data-full-diff",
  Logs = "logs",
  Settings = "settings",
  QueryDiff = "query-diff",
  ApiTesting = "api-testing",
  QueryDiffStrict = "query-diff-strict",
  ApiTestingStrict = "api-testing-strict",
}

interface ViewElementType {
  id: View;
  path?: string;
  canScreenshot?: boolean;
  icon?: IconDefinition;
  activeStyle?: object;
  name: string;
  element: React.ReactElement;
}

export type { View, ViewElementType };

export const viewElements: ViewElementType[] = [
  {
    id: View.ApiTesting,
    element: <ApiTesting />,
    icon: faCode,
    name: "API Testing",
    canScreenshot: true,
  },
  {
    id: View.QueryDiff,
    element: <QueryDiff />,
    icon: faDatabase,
    name: `Query diff - ${import.meta.env.VITE_QUERY_DIFF_VERSION}`,
    canScreenshot: true,
  },
  {
    id: View.Logs,
    icon: faClock,
    element: <Logs />,
    name: "Logs viewer",
    canScreenshot: true,
  },
  {
    id: View.CaptureDataWithFullDiff,
    element: <CaptureDataFullDiff />,
    icon: faRecordVinyl,
    name: "Capture data with full diff",
    canScreenshot: true,
  },
  {
    id: View.ChangeEventTimeLine,
    element: <CaptureDataByRecords />,
    icon: faListOl,
    name: "Change event timeline",
    canScreenshot: true,
  },
  {
    id: View.Settings,
    path: "/settings",
    icon: faGear,
    element: <Settings />,
    canScreenshot: true,
    name: "Settings",
  },
];

export const strictViewElements: ViewElementType[] = [
  {
    id: View.ApiTestingStrict,
    element: <ApiTestingStrict />,
    icon: faCode,
    name: "[VJ] API Testing",
    activeStyle: {
      backgroundColor: "#c10007",
      color: "white",
    },
    canScreenshot: true,
  },
  {
    id: View.QueryDiffStrict,
    element: <QueryDiffStrict />,
    icon: faDatabase,
    name: `[VJ] Query diff - ${import.meta.env.VITE_QUERY_DIFF_VERSION}`,
    activeStyle: {
      backgroundColor: "#c10007",
      color: "white",
    },
    canScreenshot: true,
  },
];