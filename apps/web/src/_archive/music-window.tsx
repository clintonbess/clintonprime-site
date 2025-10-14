import { useEffect, useRef, useState } from "react";
import { PrimeWindow } from "../components/prime-window";
import { Explorer } from "../components/fs/explorer";
import { FsClient } from "../lib/fs-client";

export function MusicWindow({
  onClose,
  onSelectTrack: _onSelectTrack,
}: {
  onClose: () => void;
  onSelectTrack?: (track: {
    id: string;
    name: string;
    artist: string;
    cover?: string;
    url: string;
  }) => void;
}) {
  const [musicFolderId, setMusicFolderId] = useState<string | null>(null);
  const [ready, setReady] = useState(false); // ⬅️ gate Explorer mount
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        // 1) Look for "Music" at root
        const root = await FsClient.list({ parentId: null, take: 200 });
        const music = root.items.find(
          (n) => n.kind === "folder" && n.name.toLowerCase() === "music"
        );
        // 2) Create if missing
        const folder =
          music ?? (await FsClient.createFolder("Music", null)).node;
        setMusicFolderId(folder.id);
      } catch (e: any) {
        setError(e?.message ?? "Failed to initialize Music folder");
      } finally {
        setReady(true); // ⬅️ now safe to render Explorer
      }
    })();
  }, []);

  async function handleUpload(file: File) {
    if (!file || !musicFolderId) return;
    try {
      setUploading(true);
      await FsClient.uploadMultipart(musicFolderId, file);
      setReloadKey((k) => k + 1); // refresh listing
    } catch (e: any) {
      alert(`Upload failed: ${e?.message || e}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <PrimeWindow
      title="Music"
      icon="fa-music"
      color="text-monokai-green"
      onClose={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-2 py-2 text-sm">
        <div className="text-zinc-300">
          <span className="text-monokai-green">Music</span>
          <span className="text-zinc-500"> / </span>
          <span>Library</span>
        </div>

        <label className="btn cursor-pointer">
          {uploading ? "Uploading…" : "⬆ Upload MP3"}
          <input
            type="file"
            accept="audio/mpeg,audio/*"
            hidden
            onChange={async (e) => {
              const f = e.currentTarget.files?.[0];
              if (f) await handleUpload(f);
              // e.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-400 border-b border-zinc-800">
          {error}
        </div>
      )}

      {/* Only mount Explorer after we know the folder id */}
      {!ready ? (
        <div className="p-4 text-zinc-400">Initializing Music…</div>
      ) : musicFolderId ? (
        <Explorer
          key={reloadKey}
          parentId={musicFolderId}
          onEnterFolder={() => {}}
        />
      ) : (
        <div className="p-4 text-red-400">Music folder unavailable.</div>
      )}

      <div className="p-2 border-t border-zinc-800 text-sm text-zinc-400">
        Tip: drop audio files into{" "}
        <span className="text-monokai-green">Music</span> to organize your
        library.
      </div>
    </PrimeWindow>
  );
}
