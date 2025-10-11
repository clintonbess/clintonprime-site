import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PrimeWindow } from "./prime-window";
import { useSelection } from "../hooks/use-selection";

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "document";
  parentId: string | null;
}

const DEFAULT_FILES: FileItem[] = [
  { id: "1", name: "Projects", type: "folder", parentId: null },
  { id: "2", name: "Playlists", type: "folder", parentId: null },
  { id: "3", name: "Notes.txt", type: "document", parentId: null },
  { id: "4", name: "Quantum.log", type: "document", parentId: null },
  { id: "5", name: "Vision Viewer", type: "folder", parentId: "1" },
  { id: "6", name: "dev-notes.txt", type: "document", parentId: "1" },
  { id: "7", name: "assets", type: "folder", parentId: "5" },
];

export function FileExplorerWindow({ onClose }: { onClose: () => void }) {
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
  }, []);

  // --- Persist changes ---
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem("cp_fs", JSON.stringify(files));
      localStorage.setItem("cp_fs_path", String(currentFolder));
      localStorage.setItem("cp_fs_breadcrumb", JSON.stringify(breadcrumb));
      localStorage.setItem("cp_fs_view", viewMode);
    }
  }, [files, currentFolder, breadcrumb, viewMode]);

  // --- Visible files ---
  const visibleFiles = files.filter((f) => f.parentId === currentFolder);

  // --- Navigation ---
  const openFolder = (folder: FileItem) => {
    if (folder.type !== "folder") return;
    setCurrentFolder(folder.id);
    setBreadcrumb((prev) => [...prev, folder]);
    clearSelection();
  };

  const goBack = () => {
    if (breadcrumb.length === 0) return;
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
        type: "folder",
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
        type: "document",
        parentId: currentFolder,
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
      (f) => f.type === "folder" && idsToDelete.has(f.id)
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
  ]);

  // --- Clicks ---
  const handleClick = (e: React.MouseEvent, id: string) => {
    const multi = e.ctrlKey || e.metaKey;
    const range = e.shiftKey;
    selectItem(id, multi, range);
  };

  return (
    <PrimeWindow
      title="File Explorer"
      icon="fa-folder"
      color="text-monokai-blue"
      onClose={onClose}
    >
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
      </div>

      {/* File list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFolder ?? "root"}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
          className={`grid gap-2 ${
            viewMode === "grid"
              ? "grid-cols-4 sm:grid-cols-6"
              : "grid-cols-1 divide-y divide-monokai-border"
          }`}
        >
          {visibleFiles.map((f) => (
            <div
              key={f.id}
              onClick={(e) => handleClick(e, f.id)}
              onDoubleClick={() => openFolder(f)}
              className={`p-2 rounded-md cursor-pointer flex items-center space-x-2 ${
                viewMode === "grid" ? "flex-col text-center" : ""
              } ${
                selectedIds.includes(f.id)
                  ? "bg-monokai-bg2/70 border border-monokai-blue shadow-[0_0_8px_rgba(102,217,239,0.3)]"
                  : "hover:bg-monokai-bg2/40 border border-transparent"
              } transition-all`}
            >
              <i
                className={`fa-solid ${
                  f.type === "folder" ? "fa-folder" : "fa-file-lines"
                } ${
                  f.type === "folder"
                    ? "text-monokai-yellow"
                    : "text-monokai-fg2"
                } text-xl`}
              />
              {renamingId === f.id ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    e.stopPropagation(); // prevent keydown leaks
                  }}
                  className="bg-transparent border-b border-monokai-border text-xs text-monokai-fg1 outline-none text-center"
                />
              ) : (
                <span className="truncate text-xs text-monokai-fg1">
                  {f.name}
                </span>
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </PrimeWindow>
  );
}
