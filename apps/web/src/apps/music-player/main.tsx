// apps/web/src/apps/music-player/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import type { NeoContext } from "../../kernel/types";
import type { NeoAudioFileDescriptor } from "../../kernel/types/neo-file";
import { normalizeMp3File } from "../../kernel/fs/audio-normalize";
import { Kernel } from "../../kernel/kernel";

/** Utility: mm:ss */
function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const DEFAULT_COVER = "/assets/default-album-cover.png";

function pickCover(meta: any | undefined): string {
  if (!meta) return DEFAULT_COVER;
  return (
    meta.cover ||
    meta.artworkUrl ||
    meta.coverUrl ||
    meta.image ||
    meta.albumArtUrl ||
    meta.coverBlobUrl ||
    DEFAULT_COVER
  );
}

function MusicPlayer({ ctx }: { ctx: NeoContext }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [current, setCurrent] = React.useState<NeoAudioFileDescriptor | null>(
    null
  );
  const [isPlaying, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState({ current: 0, duration: 0 });
  const [vol, setVol] = React.useState(1);
  const [over, setOver] = React.useState(false);
  const [coverUrl, setCoverUrl] = React.useState<string>(DEFAULT_COVER);

  // OS-level open
  React.useEffect(() => {
    return ctx.events.on<NeoAudioFileDescriptor>(
      "neo.audio.open",
      async (desc) => {
        setCurrent(desc);
        setCoverUrl(pickCover(desc.meta));
        if (audioRef.current) {
          audioRef.current.src = desc.blobUrl;
          try {
            await audioRef.current.play();
          } catch {
            /* autoplay might be blocked */
          }
        }
      }
    );
  }, [ctx.events]);

  // audio element events
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onMeta = () => setTime((t) => ({ ...t, duration: a.duration || 0 }));
    const onTime = () =>
      setTime({ current: a.currentTime || 0, duration: a.duration || 0 });
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVol = () => setVol(a.volume);

    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("volumechange", onVol);
    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("volumechange", onVol);
    };
  }, [audioRef.current]);

  // drag/drop → open mp3
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function prevent(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
    }
    function isMp3Drag(e: DragEvent) {
      const types = Array.from(e.dataTransfer?.types || []);
      if (types.includes("application/x-neo-audio")) return true;
      if (types.includes("application/x-neo-file")) {
        try {
          const raw = e.dataTransfer?.getData("application/x-neo-file");
          const desc = raw ? JSON.parse(raw) : null;
          return Boolean(desc && desc.type === "neo/audio" && desc.blobUrl);
        } catch {}
      }
      if (types.includes("Files")) {
        const files = Array.from(e.dataTransfer?.files || []);
        return files.some((f) => /\.mp3$/i.test(f.name));
      }
      return false;
    }

    async function drop(e: DragEvent) {
      prevent(e);
      setOver(false);
      el?.removeAttribute("data-drop-target");
      try {
        const raw = e.dataTransfer?.getData("application/x-neo-file");
        if (raw) {
          const desc = JSON.parse(raw);
          if (desc?.type === "neo/audio" && desc.blobUrl) {
            await Kernel.open({
              type: "neo/audio",
              name: desc.name,
              mime: "audio/mpeg",
              size: 0,
              blobUrl: desc.blobUrl,
              meta: desc.meta,
            });
          }
          return;
        }
        const files = Array.from(e.dataTransfer?.files || []);
        const f = files.find((f) => /\.mp3$/i.test(f.name));
        if (!f) return;
        const neo = await normalizeMp3File(f);
        await Kernel.open(neo);
      } catch {
        /* noop */
      }
    }

    function dragenter(e: DragEvent) {
      prevent(e);
      const ok = isMp3Drag(e);
      setOver(ok);
      if (ok) el?.setAttribute("data-drop-target", "music");
    }
    function dragover(e: DragEvent) {
      prevent(e);
      if (!over) setOver(isMp3Drag(e));
    }
    function dragleave(e: DragEvent) {
      prevent(e);
      setOver(false);
      el?.removeAttribute("data-drop-target");
    }

    el.addEventListener("dragenter", dragenter);
    el.addEventListener("dragover", dragover);
    el.addEventListener("dragleave", dragleave);
    el.addEventListener("drop", drop);
    return () => {
      el.removeEventListener("dragenter", dragenter);
      el.removeEventListener("dragover", dragover);
      el.removeEventListener("dragleave", dragleave);
      el.removeEventListener("drop", drop);
    };
  }, [ctx, over]);

  // actions
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };
  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !isFinite(time.duration)) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / rect.width)
    );
    a.currentTime = ratio * time.duration;
  };
  const onVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const v = Number(e.target.value);
    a.volume = v;
    setVol(v);
  };

  const progress = time.duration
    ? Math.min(1, time.current / time.duration)
    : 0;

  return (
    <div
      ref={containerRef}
      /* extra bottom/left/right padding to match HUD feel */
      className="
        relative px-6 md:px-8 pb-5 pt-4
        rounded-lg shadow-xl
        bg-[var(--color-monokai-bg3)]
        border border-[var(--color-monokai-border)]
      "
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm opacity-80">
          {current ? (
            <>
              Now Playing: <span className="font-semibold">{current.name}</span>
            </>
          ) : (
            "Drop an MP3 to start"
          )}
        </div>
        <div
          className={`h-2 w-2 rounded-full ${
            isPlaying
              ? "bg-[var(--color-monokai-green)]"
              : "bg-[var(--color-monokai-fg2)]"
          }`}
          aria-hidden
        />
      </div>

      {/* Player Shell — squared like PrimeWindow */}
      <div className="rounded-lg px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-4">
          {/* Album Cover — squared */}
          <div className="h-14 w-14 rounded-md overflow-hidden ring-1 ring-white/15 bg-[var(--color-monokai-bg2)]">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img
              src={coverUrl}
              alt={
                current?.name ? `Album art for ${current.name}` : "Album art"
              }
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => {
                if (coverUrl !== DEFAULT_COVER) setCoverUrl(DEFAULT_COVER);
              }}
            />
          </div>

          {/* Play/Pause (kept round for affordance) */}
          <button
            onClick={togglePlay}
            className="h-10 w-10 rounded-full grid place-items-center bg-white/90 text-black hover:bg-white transition"
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Timeline — squared track */}
          <div>
            <div className="flex items-center gap-3 text-xs opacity-80 mb-1">
              <span>{fmt(time.current)}</span>
              <span className="opacity-60">/</span>
              <span>{fmt(time.duration)}</span>
            </div>
            <div
              className="h-2 rounded-md bg-white/15 cursor-pointer"
              onClick={onSeek}
              title="Seek"
            >
              <div
                className="h-2 rounded-md"
                style={{
                  width: `${progress * 100}%`,
                  background: "var(--gradient-primary)",
                }}
              />
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 px-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="opacity-80"
              fill="currentColor"
            >
              <path d="M3 10v4h4l5 5V5L7 10H3z" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={vol}
              onChange={onVolChange}
              className="accent-[var(--color-monokai-green)]"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      {/* Calm Drop Hint */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 grid place-items-center transition-opacity duration-150 ${
          over ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="rounded-md px-4 py-2 border bg-black/60 text-[var(--color-monokai-green)] border-[var(--color-monokai-green)] shadow-lg">
          Drop to Music Player
        </div>
      </div>

      {/* Hidden native audio */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

export function mount(ctx: NeoContext) {
  const rootEl = document.getElementById("app-root");
  if (!rootEl) return;
  const anyEl = rootEl as any;
  if (!anyEl.__reactRoot) {
    anyEl.__reactRoot = createRoot(rootEl);
  }
  anyEl.__reactRoot.render(<MusicPlayer ctx={ctx} />);
}

export function unmount() {
  const rootEl = document.getElementById("app-root") as any;
  if (rootEl?.__reactRoot) {
    try {
      rootEl.__reactRoot.unmount();
    } finally {
      rootEl.__reactRoot = undefined;
    }
  }
}
