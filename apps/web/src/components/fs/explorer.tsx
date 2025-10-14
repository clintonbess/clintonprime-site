import type React from "react";
import { GridView, ListView, type FsViewItem } from "../fs/fs-views";
import { useFs, useViewMode } from "../../hooks/use-fs";
import { useSelection } from "../../hooks/use-selection";
import { FsClient } from "../../lib/fs-client";
import { Kernel } from "../../_archive/kernel/kernel"; // ⟵ added
import type { osFile } from "@clintonprime/types"; // ⟵ added

type Props = { parentId: string | null; onEnterFolder?: (id: string) => void };

export function Explorer({ parentId, onEnterFolder }: Props) {
  const { items, parent, loading, err, canLoadMore, loadMore, refresh } =
    useFs(parentId);
  const [mode, setMode] = useViewMode();
  const sel = useSelection<FsViewItem>(items);

  const viewItems = items.map((it) => ({
    ...it,
    selected: sel.selectedIds.includes(it.id),
  }));

  const onOpen = async (item: FsViewItem) => {
    if (item.isFolder) return onEnterFolder?.(item.id);

    // ✅ If audio file → open via Kernel → MusicPlayer
    if (item.mime?.startsWith("audio") || /\.mp3$/i.test(item.name)) {
      try {
        const url = await FsClient.streamUrl(item.id); // presigned S3 URL
        const desc: osFile.NeoAudioFileDescriptor = {
          name: item.name,
          type: "neo/audio",
          mime: "audio/mpeg",
          size: item.size ?? 0,
          blobUrl: url,
          meta: item.meta ?? {},
        };
        await Kernel.open(desc); // emits "neo.audio.open"
      } catch (err) {
        console.error("Failed to open audio:", err);
      }
      return;
    }

    // 📄 For other file types → you can extend later
    console.log("Unhandled file type:", item.mime);
  };

  const toolbar = (
    <div className="flex items-center gap-2 px-2 py-2 border-b border-zinc-800">
      <button
        className="btn"
        onClick={async () => {
          const name = prompt("New folder name?", "New Folder");
          if (!name) return;
          await FsClient.createFolder(name, parentId);
          await refresh();
        }}
      >
        ➕ New Folder
      </button>

      <button
        className="btn"
        onClick={async () => {
          const selected = items.filter((i) => sel.selectedIds.includes(i.id));
          const one = selected[0];
          if (!one) return;
          const newName = prompt("Rename to:", one.name);
          if (!newName) return;
          await FsClient.rename(one.id, newName);
          await refresh();
        }}
      >
        ✏️ Rename
      </button>

      <button
        className="btn"
        onClick={async () => {
          const ids = sel.selectedIds;
          if (!ids.length) return;
          await FsClient.move(ids, null); // demo: move to root
          await refresh();
        }}
      >
        📦 Move → root
      </button>

      <button
        className="btn"
        onClick={async () => {
          const selected = items.filter((i) => sel.selectedIds.includes(i.id));
          const one = selected[0];
          if (!one) return;
          if (!confirm(`Delete "${one.name}"?`)) return;
          await FsClient.remove(one.id);
          await refresh();
        }}
      >
        🗑️ Delete
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          className={`btn ${mode === "grid" ? "btn-active" : ""}`}
          onClick={() => setMode("grid")}
        >
          ▦ Grid
        </button>
        <button
          className={`btn ${mode === "list" ? "btn-active" : ""}`}
          onClick={() => setMode("list")}
        >
          ≣ List
        </button>
      </div>
    </div>
  );

  if (err) return <div className="p-4 text-red-400">error: {err}</div>;

  const handleClick = (e: React.MouseEvent, id: string) => {
    // your hook exposes selectItem(id, multi?, range?)
    sel.selectItem(id, e.ctrlKey || e.metaKey, e.shiftKey);
  };

  const handleDouble = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) onOpen(item);
  };

  return (
    <div className="flex flex-col h-full">
      {toolbar}

      <div className="px-2 py-1 text-sm text-zinc-400">
        {parent ? `/${parent.name}` : "/"}
      </div>

      <div className="flex-1 overflow-auto">
        {mode === "grid" ? (
          <GridView
            items={viewItems}
            onClick={handleClick}
            onDoubleClick={handleDouble}
          />
        ) : (
          <ListView
            items={viewItems}
            onClick={handleClick}
            onDoubleClick={handleDouble}
          />
        )}

        {loading && <div className="p-4 text-zinc-400">loading…</div>}
        {!loading && canLoadMore && (
          <div className="p-4">
            <button className="btn" onClick={loadMore}>
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
