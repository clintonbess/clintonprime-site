import { normalize } from "./types";
import type { FS, Stat } from "./types";

type Mount = { prefix: string; fs: FS };

export class MountableFS implements FS {
  private mounts: Mount[] = [];

  mount(prefix: string, fs: FS): this {
    prefix = normalize(prefix);
    if (prefix !== "/" && prefix.endsWith("/")) prefix = prefix.slice(0, -1);
    this.mounts = this.mounts.filter((m) => m.prefix !== prefix);
    this.mounts.push({ prefix, fs });
    // longest prefix wins
    this.mounts.sort((a, b) => b.prefix.length - a.prefix.length);
    return this;
  }

  private resolve(path: string): { fs: FS; innerPath: string } {
    path = normalize(path);
    for (const m of this.mounts) {
      if (m.prefix === "/") return { fs: m.fs, innerPath: path };
      if (path === m.prefix || path.startsWith(m.prefix + "/")) {
        const inner = path === m.prefix ? "/" : path.slice(m.prefix.length);
        return { fs: m.fs, innerPath: inner || "/" };
      }
    }
    throw new Error("No mount for path: " + path);
  }

  private listRoot(): string[] {
    const names = new Set<string>();
    for (const m of this.mounts) {
      if (m.prefix === "/") continue;
      const name = m.prefix.slice(1).split("/")[0];
      names.add(name);
    }
    return Array.from(names).sort();
  }

  // ----- FS impl -----
  async readFile(path: string, opts?: { encoding?: "utf8" | null }) {
    const { fs, innerPath } = this.resolve(path);
    return fs.readFile(innerPath, opts);
  }

  async writeFile(
    path: string,
    data: string | Uint8Array,
    opts?: { createDirs?: boolean }
  ) {
    const { fs, innerPath } = this.resolve(path);
    return fs.writeFile(innerPath, data, opts);
  }

  async readdir(path: string): Promise<string[]> {
    path = normalize(path);
    if (path === "/") return this.listRoot();
    const { fs, innerPath } = this.resolve(path);
    return fs.readdir(innerPath);
  }

  async mkdir(path: string, opts?: { recursive?: boolean }) {
    const { fs, innerPath } = this.resolve(path);
    return fs.mkdir(innerPath, opts);
  }

  async stat(path: string): Promise<Stat> {
    const { fs, innerPath } = this.resolve(path);
    return fs.stat(innerPath);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const resOld = this.resolve(oldPath);
    const resNew = this.resolve(newPath);
    if (resOld.fs !== resNew.fs) {
      // cross-mount rename: emulate via copy + delete
      const data = await resOld.fs.readFile(resOld.innerPath);
      await resNew.fs.writeFile(resNew.innerPath, data, { createDirs: true });
      await resOld.fs.unlink(resOld.innerPath);
    } else {
      await resOld.fs.rename(resOld.innerPath, resNew.innerPath);
    }
  }

  async unlink(path: string): Promise<void> {
    const { fs, innerPath } = this.resolve(path);
    return fs.unlink(innerPath);
  }

  async exists(path: string): Promise<boolean> {
    try {
      const { fs, innerPath } = this.resolve(path);
      return fs.exists(innerPath);
    } catch {
      return false;
    }
  }
}
