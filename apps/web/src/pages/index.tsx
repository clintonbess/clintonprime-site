import { useEffect, useRef } from "react";
import { WindowLayoutProvider } from "../context/window-layout-context";
import { DesktopEnvironment } from "../components/desktop-environment";
import { BootSequence } from "../components/boot-sequence";

import { Kernel } from "../kernel/kernel";
import { DropZone } from "../dropzone"; // remove if you don't want the overlay

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

    if (appRootRef.current) {
      Kernel.launch("music-player", appRootRef.current);
    }
  }, []);

  return (
    <WindowLayoutProvider>
      <BootSequence />
      <DesktopEnvironment />

      {/* Mount node for the music-player app (inside your current application) */}
      <div
        id="app-root"
        ref={appRootRef}
        className="fixed bottom-0 left-0 right-0 z-40"
        // ^ position however you want (fixed footer shown here).
        // If you want it inline, remove the classes above.
      />

      {/* Optional: global MP3 drop overlay */}
      <DropZone />
    </WindowLayoutProvider>
  );
}
