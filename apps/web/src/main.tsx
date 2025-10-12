import React from "react";
import ReactDOM from "react-dom/client";
import "./lib/fontawesome";
import "./index.css";
import IndexPage from "./pages/index";

import { Kernel } from "./kernel/kernel";

Kernel.register({
  id: "music-player",
  name: "Music Player",
  entry: () => import("./apps/music-player/main"),
});

// Ensure kernel capabilities are registered during initial load
Kernel.boot();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IndexPage />
  </React.StrictMode>
);
