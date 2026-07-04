import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import "@/lib/telemetry"; // side-effect init: Sentry + PostHog when env vars present

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
