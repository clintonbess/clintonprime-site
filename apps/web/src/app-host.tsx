import React from "react";
import { Kernel } from "./kernel/kernel";
import { DropZone } from "./dropzone";

const APPS = [{ id: "music-player", name: "Music Player" }];

export function AppHost() {
  const [active, setActive] = React.useState("music-player");

  React.useEffect(() => {
    Kernel.launch(active, document.getElementById("app-root")!);
  }, [active]);

  return (
    <div className="h-screen flex flex-col">
      <div className="p-2 border-b flex gap-2 bg-black/50">
        {APPS.map((a) => (
          <button
            key={a.id}
            className={`px-3 py-1 rounded ${
              active === a.id
                ? "bg-green-500 text-black"
                : "bg-gray-700 text-white"
            }`}
            onClick={() => setActive(a.id)}
          >
            {a.name}
          </button>
        ))}
      </div>
      <div id="app-root" className="flex-1 overflow-auto" />
      <DropZone />
    </div>
  );
}
