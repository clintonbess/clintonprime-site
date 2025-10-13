import React from "react";

export type FsViewItem = {
  id: string;
  name: string;
  isFolder: boolean;
  mime?: string | null;
  size?: number | null;
  cover?: string | null; // for files (album art / thumbs)
  selected?: boolean;
  isPlayable?: boolean; // hint for UI badges
  isLoading?: boolean; // dim while loading cover/metadata
  icon?: React.ReactNode; // optional override (e.g., filetype icon)
  meta?: {
    sizeLabel?: string; // "12.3 MB"
    typeLabel?: string; // "Folder" / "MP3"
    updatedAtLabel?: string; // "Oct 12, 2025"
  };
};

type CommonHandlers = {
  onClick: (e: React.MouseEvent, id: string) => void;
  onDoubleClick: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onKeyActivate?: (id: string) => void; // Enter/Space
  fallbackCover?: string; // e.g. "/assets/default-album-cover.png"
  getItemClassName?: (item: FsViewItem) => string | undefined;
};

function Tile({
  it,
  onClick,
  onDoubleClick,
  onDragStart,
  onContextMenu,
  onKeyActivate,
  fallbackCover,
  getItemClassName,
}: {
  it: FsViewItem;
} & CommonHandlers) {
  const className = [
    "group cursor-pointer rounded-md border transition-all outline-none focus:ring-2 focus:ring-monokai-blue/50",
    it.selected
      ? "bg-monokai-bg2/70 border-monokai-blue shadow-[0_0_8px_rgba(102,217,239,0.3)]"
      : "bg-monokai-bg2/30 border-transparent hover:bg-monokai-bg2/50",
    it.isLoading ? "opacity-60" : "",
    getItemClassName?.(it) ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      key={it.id}
      role="option"
      aria-selected={!!it.selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onKeyActivate?.(it.id);
        }
      }}
      onClick={(e) => onClick(e, it.id)}
      onDoubleClick={() => onDoubleClick(it.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, it.id);
      }}
      draggable={!it.isFolder}
      onDragStart={(e) => onDragStart?.(e, it.id)}
      className={className}
    >
      <div className="relative w-full aspect-square rounded-md overflow-hidden border border-monokai-border bg-monokai-bg3">
        {it.isFolder ? (
          <div className="h-full w-full grid place-items-center text-monokai-yellow">
            {it.icon ?? <i className="fa-solid fa-folder text-3xl" />}
          </div>
        ) : it.cover ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={it.cover}
            onError={(e) => ((e.currentTarget.src = fallbackCover!), undefined)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-monokai-fg3">
            {it.icon ?? <i className="fa-solid fa-file-audio text-2xl" />}
          </div>
        )}

        {!it.isFolder && it.isPlayable && (
          <div className="absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-[10px] bg-monokai-blue/20 text-monokai-blue border border-monokai-blue/40">
            play
          </div>
        )}
      </div>
      <div className="px-2 py-1.5 text-center">
        <span className="block text-xs text-monokai-fg1 truncate">
          {it.name}
        </span>
      </div>
    </div>
  );
}

export function GridView({
  items,
  onClick,
  onDoubleClick,
  onDragStart,
  onContextMenu,
  onKeyActivate,
  fallbackCover = "/assets/default-album-cover.png",
  getItemClassName,
  className = "",
}: {
  items: FsViewItem[];
  className?: string;
} & CommonHandlers) {
  return (
    <div
      role="listbox"
      aria-multiselectable="true"
      className={
        "grid gap-2 sm:gap-3 grid-cols-[repeat(auto-fill,minmax(112px,1fr))] " +
        className
      }
    >
      {items.map((it) => (
        <Tile
          key={it.id}
          it={it}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onDragStart={onDragStart}
          onContextMenu={onContextMenu}
          onKeyActivate={onKeyActivate}
          fallbackCover={fallbackCover}
          getItemClassName={getItemClassName}
        />
      ))}
    </div>
  );
}

function Row({
  it,
  onClick,
  onDoubleClick,
  onDragStart,
  onContextMenu,
  onKeyActivate,
  fallbackCover,
  getItemClassName,
  showHeaderLike = false,
}: {
  it: FsViewItem;
  showHeaderLike?: boolean;
} & CommonHandlers) {
  const className = [
    "flex items-center gap-3 p-2 transition-colors outline-none focus:ring-2 focus:ring-monokai-blue/50",
    it.selected ? "bg-monokai-bg2/60" : "hover:bg-monokai-bg2/40",
    it.isLoading ? "opacity-60" : "",
    getItemClassName?.(it) ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  console.log(it);
  return (
    <div
      role="option"
      aria-selected={!!it.selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onKeyActivate?.(it.id);
        }
      }}
      onClick={(e) => onClick(e, it.id)}
      onDoubleClick={() => onDoubleClick(it.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, it.id);
      }}
      draggable={!it.isFolder}
      onDragStart={(e) => onDragStart?.(e, it.id)}
      className={className}
    >
      <div className="h-8 w-8 rounded border border-monokai-border overflow-hidden bg-monokai-bg3 shrink-0">
        {it.isFolder ? (
          <div className="h-full w-full grid place-items-center text-monokai-yellow">
            {it.icon ?? <i className="fa-solid fa-folder" />}
          </div>
        ) : it.cover ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={it.cover}
            onError={(e) => ((e.currentTarget.src = fallbackCover!), undefined)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-monokai-fg3">
            {it.icon ?? <i className="fa-solid fa-file-audio" />}
          </div>
        )}
      </div>

      <span className="text-xs text-monokai-fg1 truncate grow">{it.name}</span>

      {/* Optional columns (only render if provided) */}
      {it.meta?.typeLabel && (
        <span className="hidden sm:block text-[11px] text-monokai-fg3 w-24 shrink-0 truncate">
          {it.meta.typeLabel}
        </span>
      )}
      {it.meta?.sizeLabel && (
        <span className="hidden sm:block text-[11px] text-monokai-fg3 w-20 shrink-0 text-right">
          {it.meta.sizeLabel}
        </span>
      )}
      {it.meta?.updatedAtLabel && (
        <span className="hidden md:block text-[11px] text-monokai-fg3 w-32 shrink-0 text-right">
          {it.meta.updatedAtLabel}
        </span>
      )}

      {!it.isFolder && it.isPlayable && (
        <span
          className={[
            "ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px]",
            showHeaderLike
              ? "bg-transparent text-monokai-fg3 border border-transparent"
              : "bg-monokai-blue/20 text-monokai-blue border border-monokai-blue/40",
          ].join(" ")}
        >
          play
        </span>
      )}
    </div>
  );
}

export function ListView({
  items,
  onClick,
  onDoubleClick,
  onDragStart,
  onContextMenu,
  onKeyActivate,
  fallbackCover = "/assets/default-album-cover.png",
  getItemClassName,
  className = "",
  showHeader = true,
}: {
  items: FsViewItem[];
  className?: string;
  showHeader?: boolean;
} & CommonHandlers) {
  return (
    <div className={"divide-y divide-monokai-border " + className}>
      {showHeader && (
        <div className="sticky top-0 z-10 bg-monokai-bg/70 backdrop-blur supports-[backdrop-filter]:bg-monokai-bg/40">
          <div className="flex items-center gap-3 px-2 py-1 text-[11px] text-monokai-fg3">
            <span className="grow">Name</span>
            <span className="hidden sm:block w-24 shrink-0">Type</span>
            <span className="hidden sm:block w-20 shrink-0 text-right">
              Size
            </span>
            <span className="hidden md:block w-32 shrink-0 text-right">
              Updated
            </span>
            <span className="w-8 shrink-0" />
          </div>
        </div>
      )}
      {items.map((it) => (
        <Row
          key={it.id}
          it={it}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onDragStart={onDragStart}
          onContextMenu={onContextMenu}
          onKeyActivate={onKeyActivate}
          fallbackCover={fallbackCover}
          getItemClassName={getItemClassName}
          showHeaderLike={false}
        />
      ))}
    </div>
  );
}
