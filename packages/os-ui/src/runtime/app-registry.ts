import { type FS } from "@clintonprime/types";
import type { AppManifest } from "@clintonprime/types";
import { normalize } from "@clintonprime/os-core"; // or re-export normalize from os-core

export class AppRegistry {
  private byId = new Map<string, AppManifest>();

  constructor(private fs: FS) {}

  async loadFromSystem(): Promise<void> {
    const appsDir = "/system/apps";
    const exists = await this.fs.exists(appsDir);
    if (!exists) return;

    const appDirs = await this.fs.readdir(appsDir);
    for (const dir of appDirs) {
      const manifestPath = `${appsDir}/${dir}/app.json`;
      if (!(await this.fs.exists(manifestPath))) continue;
      try {
        const json = await this.fs.readFile(manifestPath, { encoding: "utf8" });
        const manifest = JSON.parse(json as string) as AppManifest;
        if (manifest?.id && manifest?.entry) {
          this.byId.set(manifest.id, manifest);
        }
      } catch (e) {
        console.warn("[AppRegistry] bad manifest", manifestPath, e);
      }
    }
  }

  get(id: string): AppManifest | undefined {
    return this.byId.get(id);
  }

  list(): AppManifest[] {
    return Array.from(this.byId.values());
  }

  // Resolve an entry path (manifest.entry is absolute within /system)
  resolveEntry(id: string): string | null {
    const m = this.byId.get(id);
    return m?.entry ? normalize(m.entry) : null;
  }
}
