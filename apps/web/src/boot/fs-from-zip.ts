import { unzipSync } from "fflate";
import { MemoryFS } from "@clintonprime/os-core";

// Unpack /assets/os-image-v1.zip into a fresh MemoryFS
export async function loadSystemImageToMemoryFS(
  url = "/assets/os-image-v1.zip"
) {
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(
      `Failed to load system image: ${res.status} ${res.statusText}`
    );
  const buf = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(buf); // { "path/in/zip": Uint8Array, ... }

  const fs = new MemoryFS();

  // write all entries to memory fs under the same absolute paths
  // NOTE: your OverlayFS expects absolute paths like "/system/apps/...".
  // Our zip contents should be structured *as if mounted at /system*,
  // so we write files with a leading slash.
  for (const [pathInZip, bytes] of Object.entries(files)) {
    // normalize
    const p = "/" + pathInZip.replace(/\\/g, "/").replace(/^\/+/, "");
    const parts = p.split("/");
    const dir = parts.slice(0, -1).join("/") || "/";
    const name = parts[parts.length - 1];
    if (!name) continue; // skip directories (handled by mkdir recursive)

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(p, bytes, { createDirs: true });
  }

  return fs;
}
