import { Route, Routes } from "react-router";
import { Layout } from "./Layout";
import { viewElements } from "./views";
import { Browser } from "./views/Browser";

export function Router() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Browser />} />
        {viewElements
          .filter((view) => view.path)
          .map((view) => (
            <Route key={view.id} path={view.path} element={view.element} />
          ))}
      </Route>
    </Routes>
  );
}
