import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PrimeWindow } from "../components/prime-window";
import type { NeoFolderNode, NeoFileBase } from "@clintonprime/types";
import { Kernel } from "./kernel/kernel";
import { GridView, ListView, type FsViewItem } from "../components/fs/fs-views";
import type { osFile } from "@clintonprime/types";
import { useSelection } from "../hooks/use-selection";

type FileItem =
  | (NeoFolderNode & { parentId: string | null })
  | {
      id: string;
      name: string;
      nodeType: "file";
      parentId: string | null;
      file?: NeoFileBase;
    };

type OnOpenPayload = {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  cover?: string;
  url?: string;
  kind?: string;
};

const DEFAULT_FILES: FileItem[] = [
  { id: "1", name: "Projects", nodeType: "folder", parentId: null },
  { id: "2", name: "Playlists", nodeType: "folder", parentId: null },
  { id: "music", name: "Music", nodeType: "folder", parentId: null },
  {
    id: "local-tracks",
    name: "local-tracks",
    nodeType: "folder",
    parentId: "music",
  },
  { id: "5", name: "Vision Viewer", nodeType: "folder", parentId: "1" },
  { id: "7", name: "assets", nodeType: "folder", parentId: "5" },
];

// Animation: stable variants so resize/move doesn't retrigger
const FOLDER_VARIANTS = {
  show: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
} as const;
const FOLDER_TRANSITION = { duration: 0.25 } as const;

// Session cache to prevent refetch on remounts during window drag/resize
const LOCAL_MUSIC_CACHE_KEY = "cp_fs_local_music_cache_v1";
// Prevent re-fetch when window is moved/re-mounted
let DID_LOAD_LOCAL_MUSIC = false;

export function FileExplorerWindow({
  onClose,
  readOnly = false,
  rootFolderId,
  initialFolderId,
  onOpenFile,
  embedded = false,
}: {
  onClose: () => void;
  readOnly?: boolean;
  rootFolderId?: string;
  initialFolderId?: string;
  onOpenFile?: (payload: OnOpenPayload) => void;
  embedded?: boolean;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { selectedIds, selectItem, clearSelection } = useSelection(files);
  const [clipboard, setClipboard] = useState<FileItem[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  // --- Load persisted state ---
  useEffect(() => {
    const savedFiles = localStorage.getItem("cp_fs");
    const parsedFiles: FileItem[] = savedFiles
      ? JSON.parse(savedFiles)
      : DEFAULT_FILES;
    setFiles(parsedFiles);

    const savedPath = localStorage.getItem("cp_fs_path");
    const savedTrail = localStorage.getItem("cp_fs_breadcrumb");
    const savedView = localStorage.getItem("cp_fs_view");
    if (savedPath) setCurrentFolder(savedPath === "null" ? null : savedPath);
    if (savedTrail) setBreadcrumb(JSON.parse(savedTrail));
    if (savedView === "list" || savedView === "grid") setViewMode(savedView);
    // If scoped, override persisted location with provided root/initial
    if (rootFolderId) {
      const rootNode = DEFAULT_FILES.find((f) => f.id === rootFolderId) || null;
      const initId = initialFolderId || rootFolderId;
      const initNode = DEFAULT_FILES.find((f) => f.id === initId) || null;
      setCurrentFolder(initId);
      setBreadcrumb(
        [rootNode, initNode]
          .filter((x): x is FileItem => Boolean(x))
          .filter((node, idx, arr) =>
            idx === 0 ? true : node.id !== arr[0].id
          )
      );
    }
  }, [rootFolderId, initialFolderId]);

  // --- Persist changes ---
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem("cp_fs", JSON.stringify(files));
      localStorage.setItem("cp_fs_path", String(currentFolder));
      localStorage.setItem("cp_fs_breadcrumb", JSON.stringify(breadcrumb));
      localStorage.setItem("cp_fs_view", viewMode);
    }
  }, [files, currentFolder, breadcrumb, viewMode]);

  // --- Load Music > local-tracks from backend (S3-backed) ---
  useEffect(() => {
    if (DID_LOAD_LOCAL_MUSIC) return;
    // Try session cache first to avoid re-fetching on window remounts
    const cached = sessionStorage.getItem(LOCAL_MUSIC_CACHE_KEY);
    if (cached) {
      try {
        const localNodes = JSON.parse(cached) as FileItem[];
        if (Array.isArray(localNodes) && localNodes.length) {
          setFiles((prev) => {
            const filtered = prev.filter(
              (n) =>
                !(
                  n.parentId === "local-tracks" &&
                  String(n.id).startsWith("local-")
                )
            );
            return [...filtered, ...localNodes];
          });
          DID_LOAD_LOCAL_MUSIC = true;
          return; // skip network
        }
      } catch {}
    }

    (async () => {
      try {
        // Expected to be S3-sourced on the backend
        const res = await fetch("/api/music/tracks");
        if (res.ok) {
          const data = await res.json();
          const localNodes: FileItem[] = (
            Array.isArray(data.tracks) ? data.tracks : []
          ).map((t: any) => ({
            id: `local-${t.id}`,
            name: t.name,
            nodeType: "file",
            parentId: "local-tracks",
            file: {
              id: t.id,
              name: t.name,
              kind: "neo/audio",
              cover: t.cover ?? "/assets/default-cover.jpg",
              meta: { artist: t.artist, album: t.album, raw: t },
            },
          }));

          setFiles((prev) => {
            const filtered = prev.filter(
              (n) =>
                !(
                  n.parentId === "local-tracks" &&
                  String(n.id).startsWith("local-")
                )
            );
            const merged = [...filtered, ...localNodes];
            try {
              sessionStorage.setItem(
                LOCAL_MUSIC_CACHE_KEY,
                JSON.stringify(localNodes)
              );
            } catch {}
            DID_LOAD_LOCAL_MUSIC = true;
            return merged;
          });
        }
      } catch {}
    })();
  }, []);

  // --- Visible files ---
  const visibleFiles = files.filter(
    (f) => (f.parentId ?? null) === currentFolder
  );

  // --- Navigation ---
  const openFolder = (folder: FileItem) => {
    if (folder.nodeType !== "folder") return;
    setCurrentFolder(folder.id);
    setBreadcrumb((prev) => [...prev, folder]);
    clearSelection();
  };

  const goBack = () => {
    if (breadcrumb.length === 0) return;
    // prevent navigating above root when scoped
    if (rootFolderId && breadcrumb.length <= 1) {
      setCurrentFolder(rootFolderId);
      setBreadcrumb(
        [DEFAULT_FILES.find((f) => f.id === rootFolderId)].filter(
          (x): x is FileItem => Boolean(x)
        )
      );
      clearSelection();
      return;
    }
    const newTrail = [...breadcrumb];
    newTrail.pop();
    const parent = newTrail[newTrail.length - 1] ?? null;
    setCurrentFolder(parent ? parent.id : null);
    setBreadcrumb(newTrail);
    clearSelection();
  };

  // --- Add / Delete ---
  const addFolder = () => {
    const id = crypto.randomUUID();
    setFiles((prev) => [
      ...prev,
      {
        id,
        name: `New Folder ${prev.length + 1}`,
        nodeType: "folder",
        parentId: currentFolder,
      },
    ]);
  };

  const addFile = () => {
    const id = crypto.randomUUID();
    setFiles((prev) => [
      ...prev,
      {
        id,
        name: `New File ${prev.length + 1}.txt`,
        nodeType: "file",
        parentId: currentFolder,
        file: {
          id,
          name: `New File ${prev.length + 1}.txt`,
          kind: "neo/project",
          mime: "application/octet-stream",
          url: "",
          size: 0,
        },
      },
    ]);
  };

  const deleteSelected = useCallback(() => {
    const idsToDelete = new Set(selectedIds);

    const collectChildren = (parentIds: string[]): string[] => {
      const children = files.filter((f) =>
        parentIds.includes(f.parentId ?? "")
      );
      if (children.length === 0) return [];
      const childIds = children.map((c) => c.id);
      return [...childIds, ...collectChildren(childIds)];
    };

    const folders = files.filter(
      (f) => f.nodeType === "folder" && idsToDelete.has(f.id)
    );
    const allChildIds = collectChildren(folders.map((f) => f.id));

    const allIdsToRemove = new Set([...idsToDelete, ...allChildIds]);
    setFiles((prev) => prev.filter((f) => !allIdsToRemove.has(f.id)));
    clearSelection();
  }, [selectedIds, clearSelection, files]);

  // --- Rename ---
  const startRename = (file: FileItem) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === renamingId ? { ...f, name: renameValue.trim() } : f
        )
      );
    }
    setRenamingId(null);
    setRenameValue("");
  };

  // Focus and select text automatically when renaming
  useEffect(() => {
    if (renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (readOnly) {
        if (e.key === "Backspace") goBack();
        if (e.key === "Escape") clearSelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        const copied = files.filter((f) => selectedIds.includes(f.id));
        setClipboard(copied);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (clipboard.length > 0) {
          const pasted = clipboard.map((f) => ({
            ...f,
            id: crypto.randomUUID(),
            name: `${f.name.split(".")[0]}_copy${
              f.name.includes(".") ? "." + f.name.split(".").pop() : ""
            }`,
            parentId: currentFolder,
          }));
          setFiles((prev) => [...prev, ...pasted]);
        }
      } else if (e.key === "Delete") {
        deleteSelected();
      } else if (e.key === "Escape") {
        clearSelection();
      } else if (e.key === "Backspace") {
        goBack();
      } else if (e.key === "F2" && selectedIds.length === 1) {
        const file = files.find((f) => f.id === selectedIds[0]);
        if (file) startRename(file);
      } else if (e.key === "Enter" && renamingId) {
        commitRename();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    files,
    selectedIds,
    clipboard,
    currentFolder,
    deleteSelected,
    clearSelection,
    renamingId,
    renameValue,
    readOnly,
  ]);

  // --- Clicks ---
  const handleClick = (e: React.MouseEvent, id: string) => {
    const multi = e.ctrlKey || e.metaKey;
    const range = e.shiftKey;
    selectItem(id, multi, range);
  };

  const viewItems: FsViewItem[] = visibleFiles.map((f) => {
    if (f.nodeType === "folder") {
      return {
        id: f.id,
        name: f.name,
        isFolder: true,
        selected: selectedIds.includes(f.id),
      };
    }
    const file = (f as any).file;
    return {
      id: f.id,
      name: f.name,
      isFolder: false,
      cover: file?.cover || "/assets/default-album-cover.png",
      selected: selectedIds.includes(f.id),
    };
  });

  const content = (
    <>
      {/* Header: Breadcrumbs + Toolbar */}
      <div className="border-b border-monokai-border pb-2 mb-3 text-sm">
        {/* Breadcrumb Bar */}
        <div className="flex items-center justify-between mb-2 text-monokai-fg1 font-mono">
          <div className="flex items-center space-x-2">
            <button
              onClick={goBack}
              className="text-monokai-fg2 hover:text-monokai-green transition-colors"
              title="Go up one level"
            >
              ⬅
            </button>
            <span className="truncate">
              {breadcrumb.length === 0
                ? "Home"
                : breadcrumb.map((b, i) => (
                    <span key={b.id}>
                      {i > 0 && " / "}
                      <span
                        onClick={() => {
                          setCurrentFolder(b.id);
                          setBreadcrumb(breadcrumb.slice(0, i + 1));
                        }}
                        className="cursor-pointer hover:text-monokai-green"
                      >
                        {b.name}
                      </span>
                    </span>
                  ))}
            </span>
          </div>

          <button
            onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
            className="text-monokai-fg2 hover:text-monokai-green transition-colors text-xs font-mono"
          >
            {viewMode === "grid" ? "📄 List View" : "🗂 Grid View"}
          </button>
        </div>

        {/* Attached Toolbar */}
        {!readOnly && (
          <div className="flex gap-2 mt-1 text-xs font-mono">
            <button
              onClick={addFolder}
              className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] rounded border border-monokai-border hover:text-monokai-green transition"
            >
              ➕ Folder
            </button>
            <button
              onClick={addFile}
              className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] rounded border border-monokai-border hover:text-monokai-cyan transition"
            >
              📄 File
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] rounded border border-monokai-border hover:text-monokai-red transition"
              >
                🗑 Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* File list */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentFolder ?? "root"} // only changes when navigating folders
          initial={false} // don't animate on every re-render
          animate="show"
          exit="exit"
          variants={FOLDER_VARIANTS}
          transition={FOLDER_TRANSITION}
        >
          {viewMode === "grid" ? (
            <GridView
              items={viewItems}
              onClick={handleClick}
              onDoubleClick={async (id) => {
                const f = visibleFiles.find((x) => x.id === id);
                if (!f) return;
                if (f.nodeType === "folder") return openFolder(f);
                const file = (f as any).file;
                const url: string | undefined = file?.meta?.raw?.url;
                onOpenFile?.({
                  id: file?.id,
                  name: file?.name,
                  artist: file?.meta?.artist,
                  album: file?.meta?.album,
                  cover: file?.cover,
                  url,
                  kind: file?.kind,
                });
                if (file?.kind === "neo/audio" && typeof url === "string") {
                  const desc: osFile.NeoAudioFileDescriptor = {
                    type: "neo/audio",
                    name: file.name,
                    mime: "audio/mpeg",
                    size: 0,
                    blobUrl: url,
                    meta: {
                      artist: file.meta?.artist,
                      album: file.meta?.album,
                      title: file.name,
                      cover: file.cover,
                    },
                  };
                  await Kernel.open(desc);
                }
              }}
              onDragStart={(e, id) => {
                const f = visibleFiles.find((x) => x.id === id);
                if (!f || f.nodeType !== "file") return;
                const file = (f as any).file;
                const payload = {
                  id: file.id,
                  name: file.name,
                  type: file.kind,
                  blobUrl: file.meta?.raw?.url,
                  meta: {
                    artist: file.meta?.artist,
                    album: file.meta?.album,
                    cover: file.cover,
                  },
                };
                e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData(
                  "application/x-neo-file",
                  JSON.stringify(payload)
                );
                if (file.kind === "neo/audio") {
                  try {
                    e.dataTransfer.setData("application/x-neo-audio", "1");
                  } catch {}
                }
                if (typeof file.meta?.raw?.url === "string") {
                  e.dataTransfer.setData("text/uri-list", file.meta.raw.url);
                }
              }}
            />
          ) : (
            <ListView
              items={viewItems}
              onClick={handleClick}
              onDoubleClick={async (id) => {
                const f = visibleFiles.find((x) => x.id === id);
                if (!f) return;
                if (f.nodeType === "folder") return openFolder(f);
                const file = (f as any).file;
                const url: string | undefined = file?.meta?.raw?.url;
                onOpenFile?.({
                  id: file?.id,
                  name: file?.name,
                  artist: file?.meta?.artist,
                  album: file?.meta?.album,
                  cover: file?.cover,
                  url,
                  kind: file?.kind,
                });
                if (file?.kind === "neo/audio" && typeof url === "string") {
                  const desc: osFile.NeoAudioFileDescriptor = {
                    type: "neo/audio",
                    name: file.name,
                    mime: "audio/mpeg",
                    size: 0,
                    blobUrl: url,
                    meta: {
                      artist: file.meta?.artist,
                      album: file.meta?.album,
                      title: file.name,
                      cover: file.cover,
                    },
                  };
                  await Kernel.open(desc);
                }
              }}
              onDragStart={(e, id) => {
                const f = visibleFiles.find((x) => x.id === id);
                if (!f || f.nodeType !== "file") return;
                const file = (f as any).file;
                const payload = {
                  id: file.id,
                  name: file.name,
                  type: file.kind,
                  blobUrl: file.meta?.raw?.url,
                  meta: {
                    artist: file.meta?.artist,
                    album: file.meta?.album,
                    cover: file.cover,
                  },
                };
                e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData(
                  "application/x-neo-file",
                  JSON.stringify(payload)
                );
                if (file.kind === "neo/audio") {
                  try {
                    e.dataTransfer.setData("application/x-neo-audio", "1");
                  } catch {}
                }
                if (typeof file.meta?.raw?.url === "string") {
                  e.dataTransfer.setData("text/uri-list", file.meta.raw.url);
                }
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );

  if (embedded) return content;

  return (
    <PrimeWindow
      title="File Explorer"
      icon="fa-folder"
      color="text-monokai-blue"
      onClose={onClose}
    >
      {content}
    </PrimeWindow>
  );
}
