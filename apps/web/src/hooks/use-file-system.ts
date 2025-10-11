import { useState, useEffect } from "react";

export interface FileNode {
  id: string;
  name: string;
  // TODO: define all possible types
  type: "folder" | "document" | "playlist" | "collection";
  parentId: string | null;
  children?: FileNode[];
}

const MOCK_TREE: FileNode[] = [
  {
    id: "root",
    name: "Home",
    type: "folder",
    parentId: null,
    children: [
      { id: "a1", name: "Projects", type: "folder", parentId: "root" },
      { id: "a2", name: "Notes.txt", type: "document", parentId: "root" },
    ],
  },
];

export function useFileSystem() {
  const [tree, setTree] = useState<FileNode[]>(() => {
    const saved = localStorage.getItem("fileSystem");
    return saved ? JSON.parse(saved) : MOCK_TREE;
  });

  useEffect(() => {
    localStorage.setItem("fileSystem", JSON.stringify(tree));
  }, [tree]);

  const getChildren = (parentId: string | null) =>
    tree.find((n) => n.id === parentId)?.children ?? [];

  return { tree, setTree, getChildren };
}
