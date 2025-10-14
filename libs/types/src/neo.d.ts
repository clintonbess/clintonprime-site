export interface NeoFileBase<M = Record<string, unknown>> {
    id: string;
    name: string;
    mime: string;
    url: string;
    size?: number;
    meta?: M;
    kind?: string;
}
export type NeoNodeType = "folder" | "file";
export interface NeoNodeBase {
    id: string;
    name: string;
    nodeType: NeoNodeType;
    parentId?: string | null;
    children?: (NeoFolderNode | NeoFileNode)[];
}
export interface NeoFolderNode extends NeoNodeBase {
    nodeType: "folder";
}
export type NeoFileNode<T extends NeoFileBase<any> = NeoFileBase<any>> = T;
