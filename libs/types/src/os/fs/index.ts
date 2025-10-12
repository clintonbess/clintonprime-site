export interface NeoFS {
  audio: {
    fromLocalFile(
      file: File
    ): Promise<import("../file/neo-file.js").NeoFileDescriptor>;
  };
}

export type NeoNodeType = "folder" | "file";

export interface NeoNodeBase {
  id: string;
  name: string;
  nodeType: NeoNodeType;
  parentId?: string | null;
}

export interface NeoFolderNode extends NeoNodeBase {
  nodeType: "folder";
}

export interface NeoFileBase {
  id: string;
  name: string;
  kind: string;
  cover?: string;
  tags?: string[];
  meta?: Record<string, any>;
}

export interface NeoFileNode<TFile extends NeoFileBase = NeoFileBase>
  extends NeoNodeBase {
  nodeType: "file";
  file: TFile;
}
