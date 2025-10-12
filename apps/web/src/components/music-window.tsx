import { useEffect, useState } from "react";
import { PrimeWindow } from "./prime-window";
import { FaPlay } from "react-icons/fa";

type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  url: string;
};

type LocalTrack = {
  id: string;
  name: string;
  artist: string;
  cover?: string;
  url: string;
};

export function MusicWindow({
  onClose,
  onSelectTrack,
}: {
  onClose: () => void;
  onSelectTrack: (track: LocalTrack) => void;
}) {
  const [activeTab, setActiveTab] = useState<"spotify" | "local">("spotify");
  const [spotifyTracks, setSpotifyTracks] = useState<SpotifyTrack[]>([]);
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);

  // Load Spotify Recents
  useEffect(() => {
    async function loadSpotify() {
      try {
        const res = await fetch("/api/spotify/recent");
        if (!res.ok) throw new Error("Failed to load Spotify tracks");
        const data = await res.json();
        if (Array.isArray(data.tracks))
          setSpotifyTracks(data.tracks.slice(0, 5));
      } catch (e) {
        console.warn("Spotify API unavailable:", e);
      }
    }
    loadSpotify();
  }, []);

  // Load Local MP3s
  useEffect(() => {
    async function loadLocal() {
      try {
        const res = await fetch("/api/music/tracks");
        if (!res.ok) throw new Error("Failed to load tracks");
        const data = await res.json();
        if (Array.isArray(data.tracks)) setLocalTracks(data.tracks);
      } catch (err) {
        console.warn("Failed to load local tracks:", err);
        setLocalTracks([]);
      }
    }
    loadLocal();
  }, []);

  const tabs = [
    {
      key: "spotify",
      name: "spotify_recents.js",
      color: "text-monokai-green",
      icon: "fa-brands fa-spotify",
    },
    {
      key: "local",
      name: "local_tracks.js",
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

      {/* Spotify Recents */}
      {activeTab === "spotify" && (
        <div className="space-y-3">
          {!spotifyTracks.length && (
            <div className="text-monokai-fg2 text-sm">
              Loading recent Spotify tracks...
            </div>
          )}
          {spotifyTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center bg-monokai-bg2/40 border border-monokai-border rounded-lg p-3 hover:bg-monokai-bg2/70 transition-all"
            >
              <img
                src={track.image}
                alt={track.name}
                className="w-12 h-12 rounded-md mr-4 border border-monokai-border object-cover"
              />
              <div className="flex-1 truncate">
                <div className="text-monokai-fg text-sm font-medium truncate">
                  {track.name}
                </div>
                <div className="text-monokai-fg2 text-xs truncate">
                  {track.artist} • {track.album}
                </div>
              </div>
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-monokai-blue hover:text-monokai-green text-xs"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Local Tracks */}
      {activeTab === "local" && (
        <div className="grid grid-cols-3 gap-4 p-2">
          {localTracks.map((t) => (
            <div
              key={t.id}
              className="group bg-monokai-bg2/40 border border-monokai-border rounded-lg p-3 text-center hover:bg-monokai-bg2/70 transition-all"
            >
              <div className="relative w-full aspect-square bg-monokai-bg3 border border-monokai-border rounded-md mb-3 overflow-hidden">
                <button
                  onClick={() => onSelectTrack(t)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-monokai-bg/70 border border-monokai-border text-monokai-green hover:text-monokai-orange hover:bg-monokai-bg/90 transition-all shadow"
                  aria-label={`Play ${t.name}`}
                  title={`Play ${t.name}`}
                >
                  <FaPlay className="text-2xl" />
                </button>
                <img
                  src={t.cover || "/assets/default-cover.jpg"}
                  alt={t.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate text-monokai-green font-semibold text-sm">
                {t.name}
              </div>
              <div className="truncate text-monokai-fg2 text-xs mb-2">
                {t.artist}
              </div>
              <div className="flex justify-center space-x-3">
                <a
                  href={t.url}
                  download
                  className="px-2 py-1 text-xs border border-monokai-blue rounded hover:bg-monokai-blue/20 text-monokai-blue hover:text-monokai-green transition-all"
                >
                  Borrow
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </PrimeWindow>
  );
}
