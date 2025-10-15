import { useEffect, useRef, useState } from "react";
import { MountableFS, OverlayFS, MemoryFS } from "@clintonprime/os-core";
import { bootOS } from "@clintonprime/os-ui";
import { loadSystemImageToMemoryFS } from "../boot/fs-from-zip";
import { motion } from "framer-motion";
import * as React from "react";
import SpotifyWidget from "../components/widgets/spotify-widget";

window.React = React;

/**
 * IndexPage — OS Boot + Background
 * Extracted from old DesktopEnvironment background layer
 */
export default function IndexPage() {
  const osContainerRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef<null | { unmount: () => void }>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined") return;
      const target = osContainerRef.current;
      if (!target || target.dataset.booted === "1") return;

      // === File System Setup ===
      const router = new MountableFS();
      const lower = await loadSystemImageToMemoryFS("/assets/os-image-v1.zip");
      const upper = new MemoryFS();

      router
        .mount("/system", new OverlayFS(upper, lower))
        .mount("/home", new MemoryFS())
        .mount("/music", new OverlayFS(new MemoryFS(), lower.subdir("/music")));

      if (cancelled) return;

      // === Boot OS ===
      const { root } = await bootOS({ fs: router, target });
      target.dataset.booted = "1";
      bootRef.current = { unmount: () => root.unmount() };

      // Dev helper
      // @ts-ignore
      window.__fs = router;
    })().catch((e) => {
      console.error("OS boot failed:", e);
      if (osContainerRef.current) {
        osContainerRef.current.innerHTML = `<pre style="color:#f55">${String(
          e
        )}</pre>`;
      }
    });

    return () => {
      cancelled = true;
      if (bootRef.current) {
        bootRef.current.unmount();
        bootRef.current = null;
        if (osContainerRef.current)
          delete osContainerRef.current.dataset.booted;
      }
    };
  }, []);
  const [time] = useState(new Date());

  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = time.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="relative w-full min-h-[100vh] overflow-hidden bg-[var(--color-monokai-bg0)] text-[var(--color-monokai-fg0)]">
      <div
        className="top-0 left-0 right-0 h-8 flex items-center justify-between 
                   px-4 text-xs text-monokai-fg1 border-b border-monokai-border 
                   z-40"
        style={{
          background: "rgba(30,30,30,0.5)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        }}
      >
        <div className="tracking-wide text-monokai-fg1">
          <span className="text-monokai-green">ClintonPrime OS Lite</span>
        </div>
        <div className="text-monokai-fg1">
          {formattedDate} • {formattedTime}
        </div>
      </div>
      {/* === Animated Background Layer (extracted from DesktopEnvironment) === */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "linear-gradient(270deg, var(--color-monokai-green), var(--color-monokai-cyan), var(--color-monokai-orange))",
          backgroundSize: "600% 600%",
          filter: "blur(60px)",
        }}
      />

      {/* Spotify Widget - top right under the status bar */}
      <div className="fixed top-10 right-4 z-30">
        <SpotifyWidget />
      </div>

      {/* === OS Container Mount Point === */}
      <div
        ref={osContainerRef}
        className="relative z-10 w-full min-h-[80vh] backdrop-blur-[8px]"
      />
    </div>
  );
}
