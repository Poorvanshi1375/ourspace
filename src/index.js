import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Development only: lets the e2e check call the data model as the signed-in user.
// Removed from production builds (NODE_ENV is replaced at build time).
if (process.env.NODE_ENV === "development") {
  Promise.all([import("./model"), import("./firebase")]).then(([model, fb]) => {
    window.__ourspace = { model, auth: fb.auth };
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
