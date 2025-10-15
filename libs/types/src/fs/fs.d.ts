import { type NeoAudioMeta } from "../fs/audio";
import type { NeoNodeType } from "../neo";
export type FsKind = "folder" | "file" | "link";
export interface FsNodeDTO {
    id: string;
    name: string;
    kind: FsKind;
    nodeType: NeoNodeType;
    mime?: string | null;
    ext?: string | null;
    size?: number | null;
    createdAt: string;
    updatedAt: string;
    isPlayable?: boolean;
    thumbUrl?: string | null;
    path?: string;
    meta?: NeoAudioMeta | any;
}
export interface FsListRequest {
    parentId?: string | null;
    skip?: number;
    take?: number;
}
export interface FsListResponse {
    parent: FsNodeDTO | null;
    items: FsNodeDTO[];
    total: number;
    skip: number;
    take: number;
}
export interface FsCreateFolderRequest {
    parentId?: string | null;
    name: string;
}
export interface FsRenameRequest {
    name: string;
}
export interface FsMoveRequest {
    ids: string[];
    toParentId: string | null;
}
