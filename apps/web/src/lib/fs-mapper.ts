import type { FsNodeDTO } from "@clintonprime/types";
import type { FsViewItem } from "../components/fs/fs-views";

export function toFsViewItem(n: FsNodeDTO): FsViewItem {
  console.log(n.meta.cover);
  return {
    id: n.id,
    name: n.name,
    isFolder: n.nodeType === "folder",
    isPlayable: n.isPlayable,
    cover: n.meta?.cover,
    meta: {
      sizeLabel: n.size ? `${(n.size / 1024 / 1024).toFixed(2)} MB` : undefined,
      typeLabel: n.kind === "folder" ? "Folder" : "File",
      updatedAtLabel: n.updatedAt
        ? new Date(n.updatedAt).toLocaleDateString()
        : undefined,
    },
  };
}
