import { useState } from "react";
import { PrimeWindow } from "./prime-window";
import { FileExplorerWindow } from "./file-explorer-window";
import { Kernel } from "../kernel/kernel";

export function MusicWindow({
  onClose,
  onSelectTrack,
}: {
  onClose: () => void;
  onSelectTrack: (track: {
    id: string;
    name: string;
    artist: string;
    cover?: string;
    url: string;
  }) => void;
}) {
  const [activeTab, setActiveTab] = useState<"spotify" | "local">("spotify");

  const handleOpen = (file: {
    id: string;
    name: string;
    artist?: string;
    album?: string;
    cover?: string;
    url?: string;
    kind?: string;
  }) => {
    const url = file.url || "";
    const isNeoAudio = file.kind === "neo/audio" && !!url;
    if (isNeoAudio) {
      // Notify kernel listeners (player/app) with existing event contract
      Kernel.events.emit("audio:file:dropped", {
        id: file.id,
        name: file.name,
        type: "neo/audio",
        blobUrl: url,
        meta: { artist: file.artist, album: file.album, cover: file.cover },
      });
      // Update dock UI via parent handler
      onSelectTrack({
        id: file.id,
        name: file.name,
        artist: file.artist || "",
        cover: file.cover,
        url,
      });
      return;
    }
    // For list-only items (e.g., neo/audio-list), open external link as fallback
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const tabs = [
    {
      key: "spotify",
      name: "spotify-recents",
      color: "text-monokai-green",
      icon: "fa-brands fa-spotify",
    },
    {
      key: "local",
      name: "local-tracks",
      color: "text-monokai-cyan",
      icon: "fa-solid fa-music",
    },
  ];

  return (
    <PrimeWindow
      title="Music Studio"
      icon="fa-music"
      color="text-monokai-green"
      onClose={onClose}
    >
      {/* Tab bar (matches Quantum / Readme style) */}
      <div className="flex items-center space-x-2 border-b border-monokai-border pb-1 mb-3 text-xs font-mono">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "spotify" | "local")}
            className={`px-3 py-1 rounded-t-md select-none ${
              activeTab === tab.key
                ? "bg-[#2e2e2e] text-monokai-fg border-t border-x border-monokai-border"
                : "text-monokai-fg2 hover:text-monokai-fg1 cursor-pointer"
            }`}
          >
            <i className={`${tab.icon} mr-1 text-[10px]`} />
            <span className={tab.color}>{tab.name}</span>
          </div>
        ))}
      </div>

      {/* Spotify Recents (embedded read-only explorer) */}
      {activeTab === "spotify" && (
        <FileExplorerWindow
          onClose={onClose}
          embedded
          readOnly
          rootFolderId="music"
          initialFolderId="spotify-recent"
          onOpenFile={handleOpen}
        />
      )}

      {/* Local Tracks (embedded read-only explorer) */}
      {activeTab === "local" && (
        <FileExplorerWindow
          onClose={onClose}
          embedded
          readOnly
          rootFolderId="music"
          initialFolderId="local-tracks"
          onOpenFile={handleOpen}
        />
      )}
    </PrimeWindow>
  );
}
