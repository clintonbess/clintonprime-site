import { FS, Stat, normalize, dirname, basename } from "./types";

/**
 * OverlayFS: writable upper over read-only lower.
 * - reads: upper → lower (unless whiteout)
 * - writes: to upper (copy-on-write implicit)
 * - deletes: record whiteout and remove upper copy if present
 */
export class OverlayFS implements FS {
  constructor(private upper: FS, private lower: FS) {}

  private whiteoutPath(p: string) {
    return normalize("/.whiteout" + normalize(p));
  }

  private async isWhiteouted(path: string): Promise<boolean> {
    return this.upper.exists(this.whiteoutPath(path));
  }

  private async listWhiteouts(dir: string): Promise<Set<string>> {
    const prefix = normalize(dir) === "/" ? "" : normalize(dir) + "/";
    const woDir = this.whiteoutPath(dir);
    const result = new Set<string>();
    if (await this.upper.exists(woDir)) {
      const files = await this.upper.readdir(woDir);
      for (const f of files) result.add(prefix + f);
    }
    return result;
  }

  private async addWhiteout(path: string): Promise<void> {
    const dir = dirname(path);
    const name = basename(path);
    const woDir = this.whiteoutPath(dir);
    if (!(await this.upper.exists(woDir))) {
      await this.upper.mkdir(woDir, { recursive: true });
    }
    // write empty marker file named after the entry
    await this.upper.writeFile(this.whiteoutPath(path), new Uint8Array(), {
      createDirs: true,
    });
  }

  private async removeWhiteout(path: string): Promise<void> {
    if (await this.isWhiteouted(path)) {
      await this.upper.unlink(this.whiteoutPath(path));
    }
  }

  // ---------- FS impl ----------
  async readFile(path: string, opts?: { encoding?: "utf8" | null }) {
    path = normalize(path);
    if (await this.isWhiteouted(path)) throw new Error("ENOENT: " + path);
    if (await this.upper.exists(path)) return this.upper.readFile(path, opts);
    return this.lower.readFile(path, opts);
  }

  async writeFile(
    path: string,
    data: string | Uint8Array,
    opts?: { createDirs?: boolean }
  ) {
    path = normalize(path);
    await this.removeWhiteout(path);
    await this.upper.writeFile(path, data, { createDirs: true, ...opts });
  }

  async readdir(path: string): Promise<string[]> {
    path = normalize(path);
    const [uo, lo] = await Promise.allSettled([
      this.upper.readdir(path),
      this.lower.readdir(path),
    ]);
    const names = new Set<string>();
    if (lo.status === "fulfilled") for (const n of lo.value) names.add(n);
    if (uo.status === "fulfilled") for (const n of uo.value) names.add(n);
    // remove whiteouts within this directory
    const whiteouts = await this.listWhiteouts(path);
    for (const entry of Array.from(names)) {
      const full = (path === "/" ? "" : path + "/") + entry;
      if (whiteouts.has(full)) names.delete(entry);
    }
    return Array.from(names).sort();
  }

  async mkdir(path: string, opts?: { recursive?: boolean }) {
    // dirs only live in upper (writable)
    await this.removeWhiteout(path);
    await this.upper.mkdir(path, { recursive: true, ...opts });
  }

  async stat(path: string): Promise<Stat> {
    path = normalize(path);
    if (await this.isWhiteouted(path)) throw new Error("ENOENT: " + path);
    if (await this.upper.exists(path)) return this.upper.stat(path);
    return this.lower.stat(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    oldPath = normalize(oldPath);
    newPath = normalize(newPath);
    // read (upper or lower), write to upper newPath, whiteout oldPath
    const data = await this.readFile(oldPath);
    await this.writeFile(newPath, data, { createDirs: true });
    await this.unlink(oldPath);
  }

  async unlink(path: string): Promise<void> {
    path = normalize(path);
    // remove in upper if exists, and whiteout (so lower is masked)
    if (await this.upper.exists(path)) {
      await this.upper.unlink(path);
    }
    await this.addWhiteout(path);
  }

  async exists(path: string): Promise<boolean> {
    path = normalize(path);
    if (await this.isWhiteouted(path)) return false;
    if (await this.upper.exists(path)) return true;
    return this.lower.exists(path);
  }
}
