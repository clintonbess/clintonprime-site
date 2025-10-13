import { useEffect, useRef, useState } from "react";
import { PrimeWindow } from "../prime-window";
import { Explorer } from "../fs/explorer";
import { FsClient } from "../../lib/fs-client";

type Crumb = { id: string; name: string };

export function FileWindow({ onClose }: { onClose: () => void }) {
  const [stack, setStack] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0); // 🔁 force Explorer remount after upload
  const parentId = stack[stack.length - 1] ?? null;

  const nameCacheRef = useRef<Map<string, string>>(new Map());
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Crumb[] = [];
      for (const id of stack) {
        let name = nameCacheRef.current.get(id);
        if (!name) {
          try {
            const { node } = await FsClient.stat(id);
            name = node.name;
            nameCacheRef.current.set(id, name);
          } catch {
            name = "(unknown)";
          }
        }
        out.push({ id, name });
      }
      if (!cancelled) setCrumbs(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [stack]);

  const canGoBack = stack.length > 0;

  const onCrumbClick = (index: number | "home") => {
    if (index === "home") {
      setStack([]);
      return;
    }
    setStack((s) => s.slice(0, index + 1));
  };

  async function handleUpload(file: File) {
    if (!file) return;
    try {
      setUploading(true);
      await FsClient.uploadMultipart(parentId, file); // ✅ via server
      setReloadKey((k) => k + 1); // refresh listing
    } catch (e: any) {
      alert(`Upload failed: ${e?.message || e}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <PrimeWindow
      title="File System"
      icon="fa-folder"
      color="text-monokai-blue"
      onClose={onClose}
    >
      {/* ── Top bar with breadcrumb + upload ─────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-2 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="btn"
            disabled={!canGoBack}
            onClick={() => setStack((s) => s.slice(0, -1))}
            title="Go back"
          >
            ⬅ Back
          </button>

          <div className="text-zinc-300 truncate">
            <button
              className="hover:text-monokai-green transition-colors"
              onClick={() => onCrumbClick("home")}
            >
              Home
            </button>
            {crumbs.map((c, i) => (
              <span key={c.id} className="truncate">
                <span className="px-1 text-zinc-500">/</span>
                <button
                  className="hover:text-monokai-green transition-colors max-w-[12rem] truncate align-bottom"
                  title={c.name}
                  onClick={() => onCrumbClick(i)}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Upload MP3s into current folder */}
        <label className="btn cursor-pointer">
          {uploading ? "Uploading…" : "⬆ Upload MP3"}
          <input
            ref={inputRef}
            type="file"
            accept="audio/mpeg,audio/*"
            hidden
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) handleUpload(file);
            }}
          />
        </label>
      </div>
      {/* ─────────────────────────────────────────────────────────────────── */}

      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
          }
        }}
        onDrop={async (e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) await handleUpload(f);
        }}
        className="h-full"
      >
        <Explorer
          key={reloadKey}
          parentId={parentId}
          onEnterFolder={(id) => setStack((s) => [...s, id])}
        />
      </div>

      {/* Bottom bar still optional */}
      <div className="p-2 border-t border-zinc-800 flex gap-2">
        <button
          className="btn"
          disabled={!canGoBack}
          onClick={() => setStack((s) => s.slice(0, -1))}
        >
          ⬅ Back
        </button>
        <div className="text-zinc-400 text-sm">Depth: {stack.length}</div>
      </div>
    </PrimeWindow>
  );
}
