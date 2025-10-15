import pkg from "@prisma/client";
const { FsKind } = pkg as any;
import { prisma } from "@clintonprime/db";
import type {
  FsListRequest,
  FsListResponse,
  FsNodeDTO,
  NeoAudioFileNode,
  NeoFileBase,
  NeoFileNode,
} from "@clintonprime/types";
import { S3Storage } from "./fs-storage-s3.js";
import { getAudioMetadata } from "../utils/audio-metadata.js";
import type { _Object as AwsS3Object } from "@aws-sdk/client-s3";
import { extname } from "node:path";

export type S3Object = AwsS3Object;

// --- helpers ---
const AUDIO_EXTS = ["mp3", "flac", "wav", "m4a", "aac", "ogg"] as const;
function inferExt(
  name?: string | null,
  mime?: string | null
): string | undefined {
  const fromName = (name ?? "").split(".").pop();
  if (fromName && fromName !== name) return fromName.toLowerCase();
  if (!mime) return undefined;
  const [, maybe] = mime.split("/");
  return maybe?.toLowerCase();
}

const guessMime = (key: string) => {
  const ext = extname(key).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".m4a") return "audio/mp4";
  // …add more as needed
  return "application/octet-stream";
};

function toDto(n: any): FsNodeDTO {
  const mime = n.mime ?? undefined;
  const ext = n.ext ?? undefined;
  const size = n.size ?? undefined;
  const isPlayable =
    !!mime?.startsWith("audio/") ||
    AUDIO_EXTS.includes((ext ?? "").toLowerCase() as any);
  return {
    id: n.id,
    name: n.name,
    kind: n.kind as any,
    nodeType: n.nodeType as any,
    mime,
    ext,
    size,
    createdAt: n.createdAt.toISOString?.() ?? n.createdAt,
    updatedAt: n.updatedAt.toISOString?.() ?? n.updatedAt,
    isPlayable,
    thumbUrl: null,
  };
}

export const FsService = {
  async stat(id: string): Promise<FsNodeDTO> {
    const node = await prisma.fsNode.findUnique({ where: { id } });
    if (!node) throw new Error("NOT_FOUND");
    return toDto(node);
  },

  async list({
    parentId = null,
    skip = 0,
    take = 50,
  }: FsListRequest): Promise<FsListResponse> {
    if (parentId) {
      const edges = await prisma.fsEdge.findMany({
        where: { parentId },
        include: { child: true },
        skip,
        take,
        orderBy: { child: { name: "asc" } },
      });
      const total = await prisma.fsEdge.count({ where: { parentId } });
      const items = edges.map((e: any) => toDto(e.child));
      const parent = await prisma.fsNode.findUnique({
        where: { id: parentId },
      });
      return {
        parent: parent ? toDto(parent) : null,
        items,
        total,
        skip,
        take,
      };
    } else {
      // ROOT: nodes with no parents
      const items = await prisma.fsNode.findMany({
        where: { parents: { none: {} } },
        skip,
        take,
        orderBy: { name: "asc" },
      });
      const total = await prisma.fsNode.count({
        where: { parents: { none: {} } },
      });
      return { parent: null, items: items.map(toDto), total, skip, take };
    }
  },

  async createFolder(
    parentId: string | null,
    name: string
  ): Promise<FsNodeDTO> {
    const folder = await prisma.fsNode.create({
      data: { name, kind: FsKind.folder, parentId },
    });
    if (parentId) {
      await prisma.fsEdge.create({ data: { parentId, childId: folder.id } });
    }
    return toDto(folder);
  },

  // 🔹 NEW: create a file node (and optionally attach to a parent)
  async createFile(
    parentId: string | null,
    name: string,
    opts?: { mime?: string | null; size?: number | null }
  ): Promise<FsNodeDTO> {
    const mime = opts?.mime ?? undefined;
    const size = opts?.size ?? undefined;
    const ext = inferExt(name, mime);

    const node = await prisma.fsNode.create({
      data: {
        parentId,
        name,
        kind: FsKind.file,
        mime,
        size: typeof size === "number" ? size : undefined,
        ext,
      },
    });

    if (parentId) {
      await prisma.fsEdge.create({ data: { parentId, childId: node.id } });
    }

    // If it's an audio file, initialize FsMedia row (metadata can be filled later)
    const looksAudio =
      (mime ?? "").startsWith("audio/") ||
      AUDIO_EXTS.includes((ext ?? "") as any);

    if (looksAudio) {
      await prisma.fsMedia.create({ data: { nodeId: node.id } });
    }

    return toDto(node);
  },

  async rename(id: string, name: string): Promise<FsNodeDTO> {
    const node = await prisma.fsNode.update({ where: { id }, data: { name } });
    return toDto(node);
  },

  async move(
    ids: string[],
    toParentId: string | null
  ): Promise<{ moved: number }> {
    // enforce single-parent: delete old parent edges, then attach new (or detach to root if null)
    await prisma.$transaction(async (tx: typeof prisma) => {
      await tx.fsEdge.deleteMany({ where: { childId: { in: ids } } });
      if (toParentId) {
        await tx.fsEdge.createMany({
          data: ids.map((childId) => ({ parentId: toParentId, childId })),
          skipDuplicates: true,
        });
      }
    });
    return { moved: ids.length };
  },

  async remove(id: string): Promise<{ deleted: boolean }> {
    // NOTE: deleting a folder will orphan its children (become root). Implement recursive delete later if desired.
    await prisma.fsNode.delete({ where: { id } });
    return { deleted: true };
  },

  // === uploads/streaming: stubs you can back with S3 ===
  async startUpload(_args: {
    parentId: string | null;
    name: string;
    size?: number;
    mime?: string;
  }) {
    // TODO: return signed PUT url from S3 and provisional node dto
    throw new Error("NOT_IMPLEMENTED");
  },

  async getStreamUrl(_id: string): Promise<{ url: string; expiresAt: string }> {
    // TODO: return short-lived signed GET (S3) or an internal proxy path
    throw new Error("NOT_IMPLEMENTED");
  },

  async mapS3ObjectToFsNode(obj: S3Object): Promise<NeoFileNode> {
    const key = obj.Key!;
    const mime = guessMime(key);
    const name = obj.Key?.split("/").pop()!;
    const baseUrl = S3Storage.buildPresignedUrl(key);

    if (mime.startsWith("audio/") || name.endsWith(".mp3")) {
      const meta = await getAudioMetadata(baseUrl, name);
      const node: NeoAudioFileNode = {
        id: key,
        name,
        kind: "neo/audio",
        mime: "audio/mpeg",
        url: baseUrl,
        size: obj.Size,
        meta: meta as any,
      };
      return node;
    }

    return {
      id: key,
      name,
      mime,
      url: baseUrl,
      size: obj.Size,
    } satisfies NeoFileNode<NeoFileBase>;
  },
};
