import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import { AuthProvider } from "./context/AuthProvider";
import { OfflineProvider } from "./context/OfflineProvider";
import { NotificationProvider } from "./context/NotificationContext";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <OfflineProvider>
        <NotificationProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NotificationProvider>
      </OfflineProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
