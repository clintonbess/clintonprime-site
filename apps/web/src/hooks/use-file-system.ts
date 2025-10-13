import { useState, useEffect } from "react";
import type {
  NeoFolderNode,
  NeoFileNode,
  NeoFileBase,
} from "@clintonprime/types";

type FsNode = NeoFolderNode | NeoFileNode<NeoFileBase>;

const MOCK_TREE: FsNode[] = [
  {
    id: "root",
    name: "Home",
    nodeType: "folder",
    parentId: null,
    children: [
      { id: "a1", name: "Projects", nodeType: "folder", parentId: "root" },
      {
        id: "a2",
        name: "Notes.txt",
        kind: "neo/project",
        mime: "text/plain",
        url: "",
        size: 0,
      },
    ],
  },
];

export function useFileSystem() {
  const [tree, setTree] = useState<FsNode[]>(() => {
    const saved = localStorage.getItem("fileSystem");
    return saved ? JSON.parse(saved) : MOCK_TREE;
  });

  useEffect(() => {
    localStorage.setItem("fileSystem", JSON.stringify(tree));
  }, [tree]);

  const getChildren = (parentId: string | null) => {
    const node = tree.find((n) => n.id === parentId);
    return Array.isArray((node as any)?.children)
      ? ((node as any).children as FsNode[])
      : [];
  };

  return { tree, setTree, getChildren };
}
