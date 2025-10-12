// Generic Neo file types for cross-app usage

export type NeoKind = "neo/audio" | "neo/video" | "neo/project" | string;

export interface NeoFileBase {
  id: string;
  name: string;
  kind: NeoKind;
  cover?: string;
  tags?: string[];
  meta?: Record<string, any>;
}

export interface NeoFileMusic extends NeoFileBase {
  kind: "neo/audio";
  artist: string;
  album?: string;
  source: {
    url: string; // blob: or https:
    origin: "local" | "spotify" | "remote";
  };
}

// Generic explorer nodes (folders/files) for list/grid UIs
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

export interface NeoFileNode<TFile extends NeoFileBase = NeoFileBase>
  extends NeoNodeBase {
  nodeType: "file";
  file: TFile;
}
