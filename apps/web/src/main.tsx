import React from "react";
import ReactDOM from "react-dom/client";

import "./lib/fontawesome";
import "./index.css";
import IndexPage from "./pages/index";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IndexPage />
  </React.StrictMode>
);
