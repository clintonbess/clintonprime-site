import React, { useEffect, useState } from "react";
import { PrimeWindow } from "./prime-window";
import { DirListView } from "./views/dir-list-view";
import { DirGridView } from "./views/dir-grid-view";
import { TextViewer } from "./views/text-viewer";
import type { FS } from "@clintonprime/types";
import { FaTh, FaList } from "react-icons/fa";

export function PrimeTabsWindow({
  fs,
  title,
  icon,
  onClose,
  tabs,
}: {
  fs: FS;
  title: string;
  icon: string;
  onClose?: () => void;
  tabs: { id: string; label: string; path: string }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const [content, setContent] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // load data for each tab on activation
  useEffect(() => {
    (async () => {
      const tab = tabs.find((t) => t.id === active);
      if (!tab) return;
      const stat = await fs.stat(tab.path).catch(() => null);
      if (!stat) return;
      if (stat.isDir) {
        const items = await fs.readdir(tab.path);
        setContent((c) => ({ ...c, [tab.id]: { type: "dir", items } }));
      } else {
        const txt = await fs.readFile(tab.path, { encoding: "utf8" });
        setContent((c) => ({ ...c, [tab.id]: { type: "file", text: txt } }));
      }
    })();
  }, [active]);

  const current = tabs.find((t) => t.id === active);
  const data = content[active];

  return (
    <PrimeWindow title={title} icon={icon} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-white/10 p-2 bg-[#1e1e1e]">
          <div className="flex space-x-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`px-3 py-1 rounded-md text-sm ${
                  t.id === active
                    ? "bg-monokai-green/20 text-monokai-green"
                    : "text-monokai-fg1 hover:text-monokai-green/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Toggle (only visible for dirs) */}
          {data?.type === "dir" && (
            <button
              onClick={() =>
                setViewMode((m) => (m === "list" ? "grid" : "list"))
              }
              title={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
              className="text-monokai-fg1 hover:text-monokai-green transition"
            >
              {viewMode === "list" ? <FaTh /> : <FaList />}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          {!data && <div className="opacity-60">Loading…</div>}
          {data?.type === "dir" &&
            (viewMode === "list" ? (
              <DirListView files={data.items} />
            ) : (
              <DirGridView files={data.items} />
            ))}
          {data?.type === "file" && <TextViewer content={data.text} />}
        </div>
      </div>
    </PrimeWindow>
  );
}
