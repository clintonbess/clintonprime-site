-- CreateEnum
CREATE TYPE "fs_kind" AS ENUM ('folder', 'file', 'link');

-- CreateTable
CREATE TABLE "fs_node" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "fs_kind" NOT NULL,
    "mime" TEXT,
    "ext" TEXT,
    "size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fs_node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fs_edge" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,

    CONSTRAINT "fs_edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fs_media" (
    "id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "bitrate" INTEGER,
    "cover_ref" TEXT,
    "waveform" TEXT,

    CONSTRAINT "fs_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fs_node_kind_name_idx" ON "fs_node"("kind", "name");

-- CreateIndex
CREATE INDEX "fs_edge_parent_id_idx" ON "fs_edge"("parent_id");

-- CreateIndex
CREATE INDEX "fs_edge_child_id_idx" ON "fs_edge"("child_id");

-- CreateIndex
CREATE UNIQUE INDEX "fs_edge_parent_id_child_id_key" ON "fs_edge"("parent_id", "child_id");

-- CreateIndex
CREATE UNIQUE INDEX "fs_media_node_id_key" ON "fs_media"("node_id");

-- AddForeignKey
ALTER TABLE "fs_edge" ADD CONSTRAINT "fs_edge_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "fs_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fs_edge" ADD CONSTRAINT "fs_edge_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "fs_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fs_media" ADD CONSTRAINT "fs_media_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "fs_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
