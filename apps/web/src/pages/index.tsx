import { useEffect, useRef } from "react";
import { WindowLayoutProvider } from "../context/window-layout-context";
import { DragProvider } from "../context/drag-context";
import { DesktopEnvironment } from "../components/desktop-environment";
import { BootSequence } from "../components/boot-sequence";

import { Kernel } from "../kernel/kernel";
// import { DropZone } from "../dropzone"; // global overlay removed; player has scoped dropzone

export default function IndexPage() {
  // Where the music-player app will mount
  const appRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the app is registered (already done in main.tsx, but safe to re-call)
    Kernel.register({
      id: "music-player",
      name: "Music Player",
      entry: () => import("../apps/music-player/main"),
    });

    // Boot kernel capabilities once
    Kernel.boot();

    if (appRootRef.current) {
      Kernel.launch("music-player", appRootRef.current);
    }
  }, []);

  return (
    <WindowLayoutProvider>
      <DragProvider>
        <BootSequence />
        <DesktopEnvironment />

        {/* Mount node for the music-player app (inside your current application) */}
        <div
          id="app-root"
          ref={appRootRef}
          className="fixed bottom-0 left-0 right-0 z-40 mx-4 mb-6"
        />
      </DragProvider>
    </WindowLayoutProvider>
  );
}
