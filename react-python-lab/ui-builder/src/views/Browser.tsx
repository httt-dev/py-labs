/* eslint-disable @typescript-eslint/no-empty-object-type */
import { useEffect, useState } from "react";
import { strictViewElements, View, viewElements, ViewElementType } from ".";
import { Home } from "./Home";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faGear,
  faHouse,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import { useAppContext } from "../hooks/common";
import { getLocalStorageItem, setLocalStorageItem } from "../utils/storage";
import { objectToJsonString, parseJsonString } from "../utils/string";
import { screenshot } from "../utils/helper";

interface TabsProps extends ViewElementType {}

const tabsKey = "tabs";

export function Browser() {
  const ctx = useAppContext();
  const views = [...viewElements, ...strictViewElements];
  const [tabs, setTabs] = useState<TabsProps[]>([]);
  const [isHomePage, setIsHomePage] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState(-1);
  const naviagte = useNavigate();

  const addTab = (view: View) => {
    const existedTab = tabs.findIndex((tab) => tab.id === view);
    if (existedTab > -1) {
      setActiveTab(existedTab);
      setIsHomePage(false);
      return;
    }
    const newTab = views.find(
      (viewElement) => viewElement.id === view && !viewElement.path
    );
    if (newTab) {
      const indexTab = tabs.length;
      setTabs([...tabs, newTab]);
      setLocalStorageItem(
        tabsKey,
        objectToJsonString([...tabs, newTab].map((tab) => tab.id))
      );
      setActiveTab(indexTab);
      setIsHomePage(false);
    }
  };

  const closeTab = (view: View) => {
    const newTabs = tabs.filter((tab) => tab.id !== view);
    setTabs(newTabs);
    setLocalStorageItem(
      tabsKey,
      objectToJsonString(newTabs.map((tab) => tab.id))
    );
    if (newTabs.length === 0) {
      setIsHomePage(true);
      setActiveTab(-1);
    } else if (activeTab >= newTabs.length) {
      setActiveTab(newTabs.length - 1);
    }
  };

  useEffect(() => {
    const restoreTabs = () => {
      const recentTabIds = parseJsonString<View[]>(
        getLocalStorageItem(tabsKey) || "[]"
      );
      if (!recentTabIds || !Array.isArray(recentTabIds)) return;

      const restoredTabs: TabsProps[] = [];
      for (const id of recentTabIds) {
        const view = views.find((v) => v.id === id && !v.path);
        if (view) {
          restoredTabs.push(view);
        }
      }

      if (restoredTabs.length > 0) {
        setTabs(restoredTabs);
        setActiveTab(-1); // mở tab đầu tiên
        setIsHomePage(true);
      }
    };

    restoreTabs();
  }, []);

  return (
    <>
      <div className="flex flex-row rounded-t-lg h-[36px]">
        <div
          className={`flex border border-gray-200 items-center px-2 py-1 h-[36px] cursor-pointer relative rounded-t-lg shrink-0 ${
            isHomePage
              ? "bg-white border-t-black border-r-black border-l-black border-b-white"
              : "bg-gray-200 hover:bg-gray-300 border-b-black"
          }`}
          onClick={() => {
            setIsHomePage(true);
            setActiveTab(-1);
          }}
        >
          <span className="text-sm font-medium">
            <FontAwesomeIcon icon={faHouse} />
          </span>
        </div>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`flex border border-gray-200 items-center px-2 py-1 h-[36px] cursor-pointer relative rounded-t-lg shrink-0 ${
              activeTab === index
                ? "bg-white border-t-black border-r-black border-l-black border-b-white"
                : "bg-gray-200 hover:bg-gray-300 border-b-black"
            }`}
            onClick={() => {
              setActiveTab(index);
              setIsHomePage(false);
            }}
            style={ activeTab === index ? tab.activeStyle : {} }
          >
            <span className="text-sm font-medium">{tab.name}</span>
            <button
              className="ml-2 text-gray-500 hover:text-red-500 transition-all duration-100 ease-in-out border-none"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ))}
        <div className="flex justify-end items-center align-center border-b border-black w-full h-full grow-0 pr-2">
          <p className="p-0 text-xs">
            Version: {import.meta.env.VITE_APP_VERSION}
          </p>
          <button
            className="ml-2 transition-all duration-100 ease-in-out border-none"
            onClick={() => screenshot(ctx)}
            hidden={!tabs?.[activeTab]?.canScreenshot}
          >
            <FontAwesomeIcon icon={faCamera} />
          </button>
          <button
            className="ml-2 transition-all duration-100 ease-in-out border-none"
            onClick={() =>
              naviagte(
                viewElements.find(
                  (viewElement) => viewElement.id.toString() == "settings"
                )?.path || ""
              )
            }
          >
            <FontAwesomeIcon icon={faGear} />
          </button>
        </div>
      </div>
      <div
        className="flex flex-col w-full h-full bg-white"
        id="screenshot-area"
      >
        <div
          style={{
            display: isHomePage ? "block" : "none",
            height: "calc(100vh - 45px)",
          }}
        >
          <Home onNavigate={addTab} />
        </div>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            style={{
              display: activeTab === index ? "block" : "none",
              height: "calc(100vh - 45px)",
            }}
          >
            {tab.element}
          </div>
        ))}
      </div>
    </>
  );
}
