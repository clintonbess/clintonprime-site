import React from "react";
import { createRoot } from "react-dom/client";
import type { FS } from "@clintonprime/types";
import { EventBus } from "@clintonprime/os-core";
import { AppRegistry } from "./runtime/app-registry";
import { AppManager } from "./runtime/app-manager";
import { importFromFS } from "./runtime/import-from-fs";
import { createWindowHost } from "./ui/window-host";
import { Desktop } from "./desktop/desktop";

let winId = 0;
export async function bootOS(opts: { fs: FS; target?: HTMLElement }) {
  const { fs, target = document.getElementById("root")! } = opts;

  const bus = new EventBus();
  const registry = new AppRegistry(fs);
  await registry.loadFromSystem();

  const root = createRoot(target);
  const windows: React.ReactNode[] = [];
  const render = () =>
    root.render(
      <>
        <Desktop
          fs={fs}
          apps={registry.list()}
          onLaunch={(m) => manager.launch(m)}
        />
        {/* single global layer; doesn't block clicks when empty */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {windows}
        </div>
      </>
    );

  const manager = new AppManager(
    fs,
    bus,
    async (init) => {
      const id = ++winId;
      const { WindowShell, ready } = createWindowHost();

      const element = (
        <WindowShell
          key={id}
          title={init.title ?? "App"}
          onClose={() => {
            const i = windows.indexOf(element);
            if (i >= 0) {
              windows.splice(i, 1);
              render();
            }
          }}
        />
      );

      windows.push(element);
      render();

      const api = await ready;
      return api;
    },
    importFromFS
  );
  console.log("[bootOS] Rendering desktop...");
  render();
  return { fs, bus, registry, manager, root };
}

import { PrimeTabsWindow } from "./ui/prime-tabs-window";
declare global {
  interface Window {
    PrimeTabsWindow?: any;
  }
}

window.React = React;
window.PrimeTabsWindow = PrimeTabsWindow;
