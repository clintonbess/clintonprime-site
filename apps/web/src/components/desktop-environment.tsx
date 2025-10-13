import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faMusic,
  faAtom,
  faFileLines,
  faFolder,
} from "@fortawesome/free-solid-svg-icons";
import { QuantumWindow } from "./quantum-window";
import { ProgrammingWindow } from "./programming-window";
import { MusicWindow } from "./music-window";
import { ReadmeWindow } from "./readme-window";
import { FileWindow } from "./windows/file-window"; // ✅ single file window
import SpotifyWidget from "./widgets/spotify-widget";
import { Kernel } from "../kernel/kernel";
import { useDragContext } from "../context/drag-context";

function GlobalDragCue() {
  const { dragging, overTarget } = useDragContext();
  if (!dragging || overTarget) return null;
  return (
    <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-xl bg-black/60 px-3 py-1 text-sm text-white shadow">
        Drag to target… (Esc to cancel)
      </div>
    </div>
  );
}

/* Desktop Environment */
export function DesktopEnvironment() {
  const [activeWindow, setActiveWindow] = useState<
    "music" | "programming" | "quantum" | "readme" | "explorer" | null
  >(null);

  const [currentTrack, setCurrentTrack] = useState<any>(null);

  // Subscribe to OS-level open events and update currentTrack (prefer blobUrl)
  useEffect(() => {
    return Kernel.events.on<any>("neo.audio.open", (desc: any) => {
      setCurrentTrack((prev: any) => ({
        id: desc.id,
        name: desc.name,
        artist: desc.meta?.artist ?? prev?.artist ?? "Unknown",
        cover: desc.meta?.cover ?? prev?.cover ?? "/assets/default-cover.jpg",
        blobUrl: desc.blobUrl,
      }));
    });
  }, []);

  // Revoke previous blob URLs to avoid memory leaks
  useEffect(() => {
    let prevUrl: string | undefined = (currentTrack as any)?.blobUrl;
    return () => {
      if (
        prevUrl &&
        typeof prevUrl === "string" &&
        prevUrl.startsWith("blob:")
      ) {
        try {
          URL.revokeObjectURL(prevUrl);
        } catch {}
      }
    };
  }, [(currentTrack as any)?.blobUrl]);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = activeWindow
      ? `clintonprime OS — ${activeWindow}`
      : "clintonprime OS";
  }, [activeWindow]);

  const openWindow = (
    key: "music" | "programming" | "quantum" | "readme" | "explorer"
  ) => setActiveWindow((prev) => (prev === key ? null : key));

  const closeWindow = () => setActiveWindow(null);

  const controls = [
    {
      id: "readme",
      label: "README.md",
      icon: faFileLines,
      color: "text-monokai-yellow",
      ring: "ring-monokai-yellow",
    },
    {
      id: "programming",
      label: "programming.exe",
      icon: faCode,
      color: "text-monokai-blue",
      ring: "ring-monokai-blue",
    },
    {
      id: "music",
      label: "Music",
      icon: faMusic,
      color: "text-monokai-green",
      ring: "ring-monokai-green",
    },
    {
      id: "quantum",
      label: "quantum_reality",
      icon: faAtom,
      color: "text-monokai-purple",
      ring: "ring-monokai-purple",
    },
    {
      id: "explorer",
      label: "File Explorer",
      icon: faFolder,
      color: "text-monokai-blue",
      ring: "ring-monokai-blue",
    },
  ] as const;

  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = time.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-monokai-bg0)] text-[var(--color-monokai-fg0)] font-mono select-none">
      {/* Top Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-8 flex items-center justify-between 
                   px-4 text-xs text-monokai-fg1 border-b border-monokai-border 
                   z-40"
        style={{
          background: "rgba(30,30,30,0.5)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        }}
      >
        <div className="tracking-wide text-monokai-fg1">
          Workspace: <span className="text-monokai-green">Project Neo</span>
        </div>
        <div className="text-monokai-fg1">
          {formattedDate} • {formattedTime}
        </div>
      </div>

      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "linear-gradient(270deg, var(--color-monokai-green), var(--color-monokai-cyan), var(--color-monokai-orange))",
          backgroundSize: "600% 600%",
        }}
      />

      {/* Spotify Widget - top right under the status bar */}
      <div className="fixed top-10 right-4 z-30">
        <SpotifyWidget />
      </div>

      {/* App Launcher */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full pt-8">
        <h1 className="text-3xl font-bold mb-8 text-monokai-cyan tracking-wide hover:scale-105 transition-all hover:text-monokai-green">
          ClintonPrime OS
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {controls.map((c) => (
            <div
              key={c.id}
              onClick={() => openWindow(c.id)}
              className={`group glass-morphism neon-border rounded-lg px-6 py-5 cursor-pointer 
                hover:bg-opacity-40 hover:scale-105 hover:shadow-[0_0_10px_var(--color-monokai-green)] 
                transition-all floating-element flex flex-col items-center justify-center 
                ${activeWindow === c.id ? `ring-2 ${c.ring}` : ""}`}
            >
              <div
                className={`w-14 h-14 rounded-lg flex items-center justify-center mb-3 
                  bg-[var(--color-monokai-bg1)] border border-monokai-border shadow-inner
                  group-hover:shadow-[0_0_8px_var(--color-monokai-accent)]`}
              >
                <FontAwesomeIcon
                  icon={c.icon}
                  className={`${c.color} text-2xl group-hover:scale-110 transition-transform`}
                />
              </div>
              <div className="flex items-center space-x-2 text-monokai-fg text-sm font-medium">
                <FontAwesomeIcon
                  icon={c.icon}
                  className={`${c.color} text-xs`}
                />
                <span>{c.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Window */}
      {activeWindow === "readme" && <ReadmeWindow onClose={closeWindow} />}
      {activeWindow === "programming" && (
        <ProgrammingWindow onClose={closeWindow} />
      )}
      {activeWindow === "music" && (
        <MusicWindow onClose={closeWindow} onSelectTrack={setCurrentTrack} />
      )}
      {activeWindow === "quantum" && <QuantumWindow onClose={closeWindow} />}
      {activeWindow === "explorer" && <FileWindow onClose={closeWindow} />}

      {/* Global single drag cue */}
      <GlobalDragCue />
    </div>
  );
}
