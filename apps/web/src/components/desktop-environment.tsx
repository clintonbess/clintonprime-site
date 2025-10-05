import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faMusic,
  faAtom,
  faFileLines,
  faPlay,
  faPause,
} from "@fortawesome/free-solid-svg-icons";
import { QuantumWindow } from "./quantum-window";
import { ProgrammingWindow } from "./programming-window";
import { MusicWindow } from "./music-window";
import { ReadmeWindow } from "./readme-window";
import SpotifyWidget from "./widgets/spotify-widget";

/* Global Music Player Dock (bottom-left corner) */
export function MusicPlayerDock({ currentTrack }: { currentTrack: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const url = "media/" + encodeURIComponent(currentTrack.id + ".mp3");
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const format = (sec: number) => {
    if (!sec) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-50 rounded-xl shadow-lg font-mono w-64 p-4 border border-monokai-border"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
      }}
    >
      {currentTrack ? (
        <>
          <div className="flex items-center space-x-3 mb-2">
            <img
              src={currentTrack.cover || "/assets/default-cover.jpg"}
              alt={currentTrack.name}
              className="w-10 h-10 rounded-md border border-monokai-border object-cover"
            />
            <div className="flex-1 truncate">
              <div className="truncate text-monokai-green text-sm font-semibold">
                {currentTrack.name}
              </div>
              <div className="truncate text-monokai-fg1 text-xs">
                {currentTrack.artist}
              </div>
            </div>
            <button
              onClick={togglePlay}
              className={`text-lg transition-all ${
                isPlaying
                  ? "text-monokai-orange hover:text-monokai-red"
                  : "text-monokai-green hover:text-monokai-cyan"
              }`}
            ></button>
          </div>

          <div className="w-full h-1 bg-monokai-fg2/30 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-monokai-green transition-all"
              style={{
                width: `${(progress / duration) * 100 || 0}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-monokai-fg1">
            <span>{format(progress)}</span>
            <button
              onClick={togglePlay}
              className="text-monokai-green hover:text-monokai-yellow text-base transition-all"
              title={isPlaying ? "Pause" : "Play"}
            >
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            </button>
            <span>{format(duration)}</span>
          </div>
        </>
      ) : (
        <div className="text-monokai-magenta text-xs text-center py-2">
          Select a track to begin
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}

/* Desktop Environment */
export function DesktopEnvironment() {
  const [activeWindow, setActiveWindow] = useState<
    "music" | "programming" | "quantum" | "readme" | null
  >(null);

  const [currentTrack, setCurrentTrack] = useState<any>(null);
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

  const openWindow = (key: "music" | "programming" | "quantum" | "readme") =>
    setActiveWindow((prev) => (prev === key ? null : key));

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
      label: "music_studio",
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

      {/* Spotify Widget */}
      <SpotifyWidget />

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

      {/* Global Music Player Dock */}
      <MusicPlayerDock currentTrack={currentTrack} />
    </div>
  );
}
