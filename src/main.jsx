import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { DataProvider } from "./contexts/DataContext.jsx";
import "./index.css";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </SettingsProvider>
  </React.StrictMode>
);
