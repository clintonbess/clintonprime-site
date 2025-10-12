import React from "react";

type DragTarget = "music" | "mini-player" | null;

function isPlayableDrag(e: DragEvent): boolean {
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
    return files.some((f) => f.name.toLowerCase().endsWith(".mp3"));
  }
  return false;
}

export function useDragHandlers() {
  const on = React.useCallback(
    (el: HTMLElement, handlers: Record<string, any>) => {
      Object.entries(handlers).forEach(([k, v]) => el.addEventListener(k, v));
      return () =>
        Object.entries(handlers).forEach(([k, v]) =>
          el.removeEventListener(k, v)
        );
    },
    []
  );
  return on;
}

export const DragContext = React.createContext<{
  dragging: boolean;
  overTarget: DragTarget;
  setOverTarget: (t: DragTarget) => void;
  cancelDrag: () => void;
}>({
  dragging: false,
  overTarget: null,
  setOverTarget: () => {},
  cancelDrag: () => {},
});

export function useDragContext() {
  return React.useContext(DragContext);
}

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [dragging, setDragging] = React.useState(false);
  const [overTarget, setOverTarget] = React.useState<DragTarget>(null);

  React.useEffect(() => {
    function onDragEnter(e: DragEvent) {
      if (isPlayableDrag(e)) setDragging(true);
    }
    function onDragOver(e: DragEvent) {
      if (isPlayableDrag(e)) setDragging(true);
      else {
        setDragging(false);
        setOverTarget(null);
      }
    }
    function onDragLeave() {
      setDragging(false);
      setOverTarget(null);
    }
    function onDrop() {
      setDragging(false);
      setOverTarget(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDragging(false);
        setOverTarget(null);
      }
    }
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const cancelDrag = React.useCallback(() => {
    setDragging(false);
    setOverTarget(null);
  }, []);

  return (
    <DragContext.Provider
      value={{ dragging, overTarget, setOverTarget, cancelDrag }}
    >
      {children}
    </DragContext.Provider>
  );
}
