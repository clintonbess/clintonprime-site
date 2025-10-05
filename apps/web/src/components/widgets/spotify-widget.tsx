import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

interface Track {
  name: string;
  artist: string;
  albumArt: string;
  isPlaying: boolean;
  url?: string;
}

export default function SpotifyWidget() {
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    async function fetchTrack() {
      try {
        const res = await axios.get("/api/spotify/current");
        setTrack(res.data);
      } catch {
        // fallback demo track
        setTrack({
          name: "Time To Live",
          artist: "clintonprime",
          albumArt: "/assets/vaya-conver.png",
          isPlaying: false,
          url: "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp",
        });
      }
    }

    fetchTrack();
    const id = setInterval(fetchTrack, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!track) return null;

  const label = track.isPlaying ? "now playing" : "last played";
  const color = track.isPlaying
    ? "text-[var(--color-monokai-green)]"
    : "text-[var(--color-monokai-fg2)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow:
          "0 10px 25px rgba(166,226,46,0.25), 0 0 12px rgba(102,217,239,0.15)",
      }}
      className="fixed bottom-6 right-6 z-40 rounded-2xl px-5 py-4 w-[260px]
                 border border-[var(--color-monokai-border)] 
                 shadow-lg bg-[var(--color-monokai-bg0)]/70 
                 backdrop-blur-xl transition-all duration-300 "
      style={{
        boxShadow:
          "0 8px 20px rgba(0,0,0,0.3), inset 0 0 8px rgba(166,226,46,0.05)",
      }}
    >
      {/* ↗ Spotify External Link */}
      {track.url && (
        <a
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Spotify"
          className="absolute top-2 right-2 text-[var(--color-monokai-blue)] hover:text-[var(--color-monokai-green)] transition-colors"
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
        </a>
      )}

      {/* Header / Label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <span
            className={`uppercase text-[10px] tracking-wider font-semibold ${color}`}
          >
            <span
              className="font-bold bg-gradient-to-r from-[var(--color-monokai-green)] 
                         via-[var(--color-monokai-blue)] to-[var(--color-monokai-cyan)] 
                         bg-clip-text text-transparent pr-1"
            >
              clintonprime
            </span>
            {label}
          </span>
        </div>

        {track.isPlaying && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
            className="w-2 h-2 rounded-full bg-[var(--color-monokai-green)] shadow-[0_0_6px_rgba(166,226,46,0.6)]"
          />
        )}
      </div>

      {/* Track Info */}
      <div className="flex items-center gap-3">
        <motion.img
          src={track.albumArt}
          alt={track.name}
          className="w-12 h-12 rounded-md object-cover border border-[var(--color-monokai-border)] shadow-sm"
          whileHover={{ scale: 1.05, rotate: 0.5 }}
          transition={{ type: "spring", stiffness: 150, damping: 10 }}
        />

        <div className="flex flex-col justify-center leading-tight">
          <div className="text-[var(--color-monokai-green)] font-semibold text-sm truncate w-36">
            {track.name}
          </div>
          <div className="text-[var(--color-monokai-fg1)] truncate text-xs w-36">
            {track.artist}
          </div>
        </div>
      </div>

      {/* Decorative Footer Glow */}
      <motion.div
        className="h-[1px] mt-3 rounded-full bg-gradient-to-r from-[var(--color-monokai-green)] via-[var(--color-monokai-blue)] to-transparent opacity-60"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
