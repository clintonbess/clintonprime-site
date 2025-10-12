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

const FALLBACK_ART = "/assets/default-album-cover.png";

export default function SpotifyWidget() {
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    async function fetchTrack() {
      try {
        const res = await axios.get("/api/spotify/current");
        setTrack(res.data);
      } catch {
        // fallback demo track uses the same fallback art
        setTrack({
          name: "Time To Live",
          artist: "clintonprime",
          albumArt: FALLBACK_ART,
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
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 16 }}
      /* removed whileHover */
      className="
        relative w-[260px]
        rounded-lg
        px-4 py-3
        border border-[var(--color-monokai-border)]
        bg-[var(--color-monokai-bg0)]/65
        backdrop-blur-xl
        shadow-[0_8px_20px_rgba(0,0,0,0.30)]
        transition-all duration-300
      "
      style={{
        boxShadow:
          "0 8px 20px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* external link */}
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

      {/* header */}
      <div className="flex items-center gap-2 justify-start mb-2">
        {track.isPlaying && (
          <motion.div
            animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full bg-[var(--color-monokai-green)] shadow-[0_0_6px_rgba(166,226,46,0.55)]"
          />
        )}
        <div className="uppercase text-[10px] tracking-wider font-semibold">
          <span
            className="font-bold bg-gradient-to-r from-[var(--color-monokai-green)]
                       via-[var(--color-monokai-blue)] to-[var(--color-monokai-cyan)]
                       bg-clip-text text-transparent pr-1"
          >
            clintonprime
          </span>
          <span className={color}>{label}</span>
        </div>
      </div>

      {/* body */}
      <div className="flex items-center gap-3">
        <img
          src={track.albumArt}
          onError={(e) => ((e.currentTarget.src = FALLBACK_ART), undefined)}
          alt={track.name}
          className="
            w-12 h-12 rounded-md
            object-cover
            border border-[var(--color-monokai-border)]
            shadow-[0_1px_4px_rgba(0,0,0,0.35)]
          "
        />

        <div className="flex flex-col leading-tight min-w-0">
          <div className="text-[var(--color-monokai-green)] font-semibold text-sm truncate">
            {track.name}
          </div>
          <div className="text-[var(--color-monokai-fg1)] truncate text-xs">
            {track.artist}
          </div>
        </div>
      </div>

      {/* footer line (kept subtle animation, not hover) */}
      <motion.div
        className="h-[1px] mt-3 rounded-[2px] bg-gradient-to-r from-[var(--color-monokai-green)] via-[var(--color-monokai-blue)] to-transparent opacity-60"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
