import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { Router } from "./Routes";
import "./styles/index.css";
import { AppProvider } from "./context/Provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <HashRouter>
        <Router />
      </HashRouter>
    </AppProvider>
  </StrictMode>
);
