import { FS, Stat, normalize, dirname, basename } from "./types";

type Node = {
  type: "file" | "dir";
  c: Map<string, Node> | Uint8Array;
  ctimeMs: number;
  mtimeMs: number;
};

export class MemoryFS implements FS {
  private root: Node = {
    type: "dir",
    c: new Map(),
    ctimeMs: Date.now(),
    mtimeMs: Date.now(),
  };

  private getNode(p: string): Node | null {
    p = normalize(p);
    if (p === "/") return this.root;
    const parts = p.slice(1).split("/");
    let cur: Node = this.root;
    for (const seg of parts) {
      if (cur.type !== "dir") return null;
      const next = (cur.c as Map<string, Node>).get(seg);
      if (!next) return null;
      cur = next;
    }
    return cur;
  }

  private ensureDir(p: string): Node {
    p = normalize(p);
    if (p === "/") return this.root;
    const parts = p.slice(1).split("/");
    let cur: Node = this.root;
    for (const seg of parts) {
      if (cur.type !== "dir") throw new Error("Not a directory: " + p);
      const dirMap = cur.c as Map<string, Node>;
      let next = dirMap.get(seg);
      if (!next) {
        next = {
          type: "dir",
          c: new Map(),
          ctimeMs: Date.now(),
          mtimeMs: Date.now(),
        };
        dirMap.set(seg, next);
      }
      cur = next;
    }
    return cur;
  }

  async readFile(
    path: string,
    opts?: { encoding?: "utf8" | null }
  ): Promise<string | Uint8Array> {
    const n = this.getNode(path);
    if (!n || n.type !== "file") throw new Error("ENOENT: " + path);
    const buf = n.c as Uint8Array;
    if (opts?.encoding === "utf8") return new TextDecoder().decode(buf);
    return buf;
  }

  async writeFile(
    path: string,
    data: string | Uint8Array,
    opts?: { createDirs?: boolean }
  ): Promise<void> {
    path = normalize(path);
    const parent = dirname(path);
    if (!(await this.exists(parent))) {
      if (opts?.createDirs) await this.mkdir(parent, { recursive: true });
      else throw new Error("ENOENT parent: " + parent);
    }
    const parentNode = this.getNode(parent)!;
    if (parentNode.type !== "dir") throw new Error("ENOTDIR parent: " + parent);
    const name = basename(path);
    const buf =
      typeof data === "string" ? new TextEncoder().encode(data) : data;
    (parentNode.c as Map<string, Node>).set(name, {
      type: "file",
      c: buf,
      ctimeMs: Date.now(),
      mtimeMs: Date.now(),
    });
  }

  async readdir(path: string): Promise<string[]> {
    const n = this.getNode(path);
    if (!n || n.type !== "dir") throw new Error("ENOTDIR: " + path);
    return Array.from((n.c as Map<string, Node>).keys()).sort();
  }

  async mkdir(path: string, opts?: { recursive?: boolean }): Promise<void> {
    path = normalize(path);
    if (await this.exists(path)) {
      const n = this.getNode(path)!;
      if (n.type !== "dir") throw new Error("ENOTDIR: " + path);
      return;
    }
    if (!opts?.recursive) {
      const parent = dirname(path);
      if (!(await this.exists(parent)))
        throw new Error("ENOENT parent: " + parent);
    }
    this.ensureDir(path);
  }

  async stat(path: string): Promise<Stat> {
    const n = this.getNode(path);
    if (!n) throw new Error("ENOENT: " + path);
    if (n.type === "dir") {
      return {
        size: 0,
        ctimeMs: n.ctimeMs,
        mtimeMs: n.mtimeMs,
        isFile: false,
        isDir: true,
      };
    }
    const buf = n.c as Uint8Array;
    return {
      size: buf.byteLength,
      ctimeMs: n.ctimeMs,
      mtimeMs: n.mtimeMs,
      isFile: true,
      isDir: false,
    };
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    oldPath = normalize(oldPath);
    newPath = normalize(newPath);
    const oldParent = this.getNode(dirname(oldPath));
    const node = this.getNode(oldPath);
    if (!oldParent || oldParent.type !== "dir" || !node)
      throw new Error("ENOENT: " + oldPath);
    const nameOld = basename(oldPath);
    const newParent = this.ensureDir(dirname(newPath));
    const nameNew = basename(newPath);
    (newParent.c as Map<string, Node>).set(nameNew, node);
    (oldParent.c as Map<string, Node>).delete(nameOld);
  }

  async unlink(path: string): Promise<void> {
    const parent = this.getNode(dirname(path));
    if (!parent || parent.type !== "dir")
      throw new Error("ENOENT parent: " + path);
    const name = basename(path);
    if (!(parent.c as Map<string, Node>).has(name))
      throw new Error("ENOENT: " + path);
    (parent.c as Map<string, Node>).delete(name);
  }

  async exists(path: string): Promise<boolean> {
    return !!this.getNode(path);
  }

  subdir(prefix: string): FS {
    const base = normalize(prefix);
    const wrap = (p: string) => normalize(`${base}/${p}`);
    return {
      readFile: (p, o) => this.readFile(wrap(p), o),
      writeFile: (p, d, o) => this.writeFile(wrap(p), d, o),
      readdir: (p) => this.readdir(wrap(p)),
      mkdir: (p, o) => this.mkdir(wrap(p), o),
      stat: (p) => this.stat(wrap(p)),
      rename: (a, b) => this.rename(wrap(a), wrap(b)),
      unlink: (p) => this.unlink(wrap(p)),
      exists: (p) => this.exists(wrap(p)),
    };
  }
}
