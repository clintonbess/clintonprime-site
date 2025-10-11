import { useState } from "react";

export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  const selectItem = (id: string, multi = false, range = false) => {
    if (range && lastSelected) {
      const start = items.findIndex((i) => i.id === lastSelected);
      const end = items.findIndex((i) => i.id === id);
      const slice = items
        .slice(Math.min(start, end), Math.max(start, end) + 1)
        .map((i) => i.id);
      setSelectedIds(slice);
    } else if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
    setLastSelected(id);
  };

  const clearSelection = () => setSelectedIds([]);

  return { selectedIds, selectItem, clearSelection };
}
