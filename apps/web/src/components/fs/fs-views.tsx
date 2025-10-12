import React from "react";

export type FsViewItem = {
  id: string;
  name: string;
  isFolder: boolean;
  cover?: string | null; // for files
  selected?: boolean;
};

type CommonHandlers = {
  onClick: (e: React.MouseEvent, id: string) => void;
  onDoubleClick: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  fallbackCover?: string; // e.g. "/assets/default-album-cover.png"
};

export function GridView({
  items,
  onClick,
  onDoubleClick,
  onDragStart,
  fallbackCover = "/assets/default-album-cover.png",
  className = "",
}: {
  items: FsViewItem[];
  className?: string;
} & CommonHandlers) {
  return (
    <div
      className={
        // responsive auto-fit, always square cells
        "grid gap-2 sm:gap-3 grid-cols-[repeat(auto-fill,minmax(112px,1fr))] " +
        className
      }
    >
      {items.map((it) => (
        <div
          key={it.id}
          onClick={(e) => onClick(e, it.id)}
          onDoubleClick={() => onDoubleClick(it.id)}
          draggable={!it.isFolder}
          onDragStart={(e) => onDragStart?.(e, it.id)}
          className={[
            "group cursor-pointer rounded-md border transition-all",
            it.selected
              ? "bg-monokai-bg2/70 border-monokai-blue shadow-[0_0_8px_rgba(102,217,239,0.3)]"
              : "bg-monokai-bg2/30 border-transparent hover:bg-monokai-bg2/50",
          ].join(" ")}
        >
          <div className="w-full aspect-square rounded-md overflow-hidden border border-monokai-border bg-monokai-bg3">
            {it.isFolder ? (
              <div className="h-full w-full grid place-items-center text-monokai-yellow">
                <i className="fa-solid fa-folder text-3xl" />
              </div>
            ) : (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img
                src={it.cover || fallbackCover}
                onError={(e) => (
                  (e.currentTarget.src = fallbackCover), undefined
                )}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="px-2 py-1.5 text-center">
            <span className="block text-xs text-monokai-fg1 truncate">
              {it.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListView({
  items,
  onClick,
  onDoubleClick,
  onDragStart,
  fallbackCover = "/assets/default-album-cover.png",
  className = "",
}: {
  items: FsViewItem[];
  className?: string;
} & CommonHandlers) {
  return (
    <div className={"divide-y divide-monokai-border " + className}>
      {items.map((it) => (
        <div
          key={it.id}
          onClick={(e) => onClick(e, it.id)}
          onDoubleClick={() => onDoubleClick(it.id)}
          draggable={!it.isFolder}
          onDragStart={(e) => onDragStart?.(e, it.id)}
          className={[
            "flex items-center gap-3 p-2 transition-colors",
            it.selected ? "bg-monokai-bg2/60" : "hover:bg-monokai-bg2/40",
          ].join(" ")}
        >
          <div className="h-8 w-8 rounded border border-monokai-border overflow-hidden bg-monokai-bg3">
            {it.isFolder ? (
              <div className="h-full w-full grid place-items-center text-monokai-yellow">
                <i className="fa-solid fa-folder" />
              </div>
            ) : (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img
                src={it.cover || fallbackCover}
                onError={(e) => (
                  (e.currentTarget.src = fallbackCover), undefined
                )}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <span className="text-xs text-monokai-fg1 truncate">{it.name}</span>
        </div>
      ))}
    </div>
  );
}
