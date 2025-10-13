import { useCallback, useEffect, useState } from "react";
import { FsClient } from "../lib/fs-client";
import { toFsViewItem } from "../lib/fs-mapper";
import type { FsNodeDTO } from "@clintonprime/types";
import type { FsViewItem } from "../components/fs/fs-views";

export type ViewMode = "grid" | "list";

export function useFs(parentId: string | null) {
  const [items, setItems] = useState<FsViewItem[]>([]);
  const [parent, setParent] = useState<FsNodeDTO | null>(null);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [take] = useState(50);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(
    async (reset = true) => {
      try {
        setLoading(true);
        const res = await FsClient.list({
          parentId,
          skip: reset ? 0 : skip,
          take,
        });
        setParent(res.parent);
        setTotal(res.total);
        setSkip((reset ? 0 : skip) + res.items.length);
        setItems((prev) =>
          reset
            ? res.items.map(toFsViewItem)
            : [...prev, ...res.items.map(toFsViewItem)]
        );
      } catch (e: any) {
        setErr(e.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [parentId, skip, take]
  );

  useEffect(() => {
    // when parent changes, reset
    setSkip(0);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  const canLoadMore = items.length < total;

  return {
    items,
    parent,
    total,
    loading,
    err,
    canLoadMore,
    loadMore: () => load(false),
    refresh: () => load(true),
  };
}

export function useViewMode(
  key = "fs:viewMode"
): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(
    () => (localStorage.getItem(key) as ViewMode) || "grid"
  );
  const set = useCallback(
    (m: ViewMode) => {
      setMode(m);
      localStorage.setItem(key, m);
    },
    [key]
  );
  return [mode, set];
}
