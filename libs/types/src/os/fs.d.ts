export interface Stat {
    size: number;
    ctimeMs: number;
    mtimeMs: number;
    isFile: boolean;
    isDir: boolean;
}
export interface FS {
    readFile(path: string, opts?: {
        encoding?: "utf8" | null;
    }): Promise<string | Uint8Array>;
    writeFile(path: string, data: string | Uint8Array, opts?: {
        createDirs?: boolean;
    }): Promise<void>;
    readdir(path: string): Promise<string[]>;
    mkdir(path: string, opts?: {
        recursive?: boolean;
    }): Promise<void>;
    stat(path: string): Promise<Stat>;
    rename(oldPath: string, newPath: string): Promise<void>;
    unlink(path: string): Promise<void>;
    exists(path: string): Promise<boolean>;
}
