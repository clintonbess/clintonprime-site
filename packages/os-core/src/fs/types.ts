export interface Stat {
  size: number;
  ctimeMs: number;
  mtimeMs: number;
  isFile: boolean;
  isDir: boolean;
}

export interface FS {
  readFile(
    path: string,
    opts?: { encoding?: "utf8" | null }
  ): Promise<string | Uint8Array>;
  writeFile(
    path: string,
    data: string | Uint8Array,
    opts?: { createDirs?: boolean }
  ): Promise<void>;
  readdir(path: string): Promise<string[]>;
  mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>;
  stat(path: string): Promise<Stat>;
  rename(oldPath: string, newPath: string): Promise<void>;
  unlink(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

export type Path = string;

// utils
export function normalize(p: string): string {
  if (!p) return "/";
  let out = p.replace(/\\/g, "/");
  if (!out.startsWith("/")) out = "/" + out;
  // collapse // and remove trailing slash except root
  out = out.replace(/\/{2,}/g, "/");
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}
export function dirname(p: string): string {
  p = normalize(p);
  if (p === "/") return "/";
  const i = p.lastIndexOf("/");
  return i <= 0 ? "/" : p.slice(0, i);
}
export function basename(p: string): string {
  p = normalize(p);
  if (p === "/") return "/";
  const i = p.lastIndexOf("/");
  return i < 0 ? p : p.slice(i + 1);
}
