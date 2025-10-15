// libs/api/src/apps/fs/fs-controller.ts
import type { Request, Response } from "express";
import { z } from "zod";
import { Readable } from "stream";
import { prisma } from "@clintonprime/db";

import { FsService } from "../../services/fs-service.js";
import { S3Storage } from "../../services/fs-storage-s3.js";
import type { NeoAudioMeta, NeoFileNode } from "@clintonprime/types";
import { getAudioMetadata } from "../../utils/audio-metadata.js";

// ───────────────────────────────────────────────────────────────
// Validation Schemas
// ───────────────────────────────────────────────────────────────
const listQ = z.object({
  parentId: z.string().uuid().optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
});

const createFolderB = z.object({
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(255),
});

const renameB = z.object({
  name: z.string().min(1).max(255),
});

const moveB = z.object({
  ids: z.array(z.string().uuid()).nonempty(),
  toParentId: z.string().uuid().nullable(),
});

const uploadInitB = z.object({
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(255),
  mime: z.string().min(1).optional(),
  size: z.coerce.number().int().positive().optional(),
});

const AUDIO_EXTS = ["mp3", "flac", "wav", "m4a", "aac", "ogg"] as const;

// ───────────────────────────────────────────────────────────────
// Controller Implementation
// ───────────────────────────────────────────────────────────────
export const FsController = {
  /** List directory contents */
  async list(req: Request, res: Response) {
    const { parentId = null, skip = 0, take = 100 } = listQ.parse(req.query);

    const [rows, total] = await Promise.all([
      prisma.fsNode.findMany({
        where: { parentId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.fsNode.count({ where: { parentId } }),
    ]);

    const items: NeoFileNode[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      mime: row.mime ?? "application/octet-stream",
      url: `/api/fs/stream/${row.id}`,
      size: row.size ?? undefined,
      kind: row.mime?.startsWith("audio/") ? "neo/audio" : "neo/file",
      meta: (row.meta as NeoAudioMeta) ?? {},
      nodeType: row.kind === "folder" ? "folder" : "file",
    }));

    return res.json({ items, total });
  },

  /** Stat a single node by ID */
  async stat(req: Request, res: Response) {
    const id = z.string().uuid().parse(req.params.id);
    const node = await FsService.stat(id);
    if (!node) return res.status(404).json({ code: "NOT_FOUND" });
    return res.json({ node });
  },

  /** Create a new folder */
  async createFolder(req: Request, res: Response) {
    const { parentId = null, name } = createFolderB.parse(req.body);
    const node = await FsService.createFolder(parentId, name);
    return res.status(201).json({ node });
  },

  /** Rename an existing node */
  async rename(req: Request, res: Response) {
    const id = z.string().uuid().parse(req.params.id);
    const { name } = renameB.parse(req.body);
    const node = await FsService.rename(id, name);
    return res.json({ node });
  },

  /** Move one or more nodes */
  async move(req: Request, res: Response) {
    const { ids, toParentId } = moveB.parse(req.body);
    const result = await FsService.move(ids, toParentId);
    return res.json(result);
  },

  /** Remove a node */
  async remove(req: Request, res: Response) {
    const id = z.string().uuid().parse(req.params.id);
    const result = await FsService.remove(id);
    return res.json(result);
  },

  // ────────────────────────────────
  // Option A: multipart upload
  // ────────────────────────────────
  async upload(req: Request, res: Response) {
    const file = (req as any).file as Express.Multer.File;
    const parentId = (req.query.parentId as string) || null;
    if (!file) return res.status(400).json({ code: "NO_FILE" });

    // 1️⃣ create file node (DB)
    const node = await FsService.createFile(parentId, file.originalname, {
      mime: file.mimetype,
      size: file.size,
    });

    // 2️⃣ stream to S3
    await S3Storage.saveStream(
      node.id,
      Readable.from(file.buffer),
      file.mimetype,
      node.ext
    );

    // 3️⃣ after upload — extract metadata if audio
    const looksAudio =
      (file.mimetype ?? "").startsWith("audio/") ||
      AUDIO_EXTS.includes((node.ext ?? "") as any);

    if (looksAudio) {
      try {
        const url = await S3Storage.signedGetUrl(
          node.id,
          node.ext,
          node.mime ?? undefined
        );
        const meta = await getAudioMetadata(url, node.name);
        if (meta && Object.keys(meta).length > 0) {
          await prisma.fsNode.update({
            where: { id: node.id },
            data: { meta: meta as any },
          });
          node.meta = meta;
        }
      } catch (err) {
        console.warn(
          `[FsController.upload] metadata extraction failed for ${node.name}:`,
          err
        );
      }
    }

    return res.status(201).json({ node });
  },

  // ────────────────────────────────
  // Stream: 302 redirect to signed S3 GET
  // ────────────────────────────────
  async stream(req: Request, res: Response) {
    const id = z.string().uuid().parse(req.params.id);
    const node = await prisma.fsNode.findUnique({ where: { id } });
    if (!node) return res.status(404).json({ code: "NOT_FOUND" });

    const head = await S3Storage.head(id, node.ext);
    if (!head) return res.status(404).json({ code: "NO_CONTENT" });

    const url = await S3Storage.signedGetUrl(
      id,
      node.ext,
      node.mime || undefined
    );
    return res.redirect(302, url);
  },

  // ────────────────────────────────
  // Option B: Direct-to-S3 Presigned PUT
  // ────────────────────────────────
  async uploadInit(req: Request, res: Response) {
    const { parentId = null, name, mime, size } = uploadInitB.parse(req.body);

    // 1️⃣ create node
    const node = await FsService.createFile(parentId, name, { mime, size });

    // 2️⃣ get signed PUT URL
    const { url } = await S3Storage.signedPut(
      node.id,
      node.ext,
      node.mime || undefined
    );

    // 3️⃣ return node DTO + PUT URL
    return res.status(201).json({ node, putUrl: url });
  },
};
