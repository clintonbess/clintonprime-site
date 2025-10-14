import type { FS, AppContext, AppManifest } from "@clintonprime/types";
import { EventBus } from "@clintonprime/os-core";

export type AppModule = {
  default: (
    ctx: AppContext
  ) => void | (() => void) | Promise<void | (() => void)>;
};

type OpenWindow = (opts: { title?: string }) => {
  mount(node: React.ReactNode): void;
  setTitle(title: string): void;
  focus(): void;
  close(): void;
};

export class AppManager {
  constructor(
    private fs: FS,
    private bus: EventBus,
    private openWindow: OpenWindow,
    private importFromFS: (fs: FS, path: string) => Promise<AppModule>
  ) {}

  async launch(manifest: AppManifest, openPath?: string): Promise<void> {
    const ui = { openWindow: this.openWindow };
    const ctx: AppContext = {
      manifest,
      fs: this.fs,
      bus: this.bus,
      ui,
      canOpen: () => true,
    };

    const mod = await this.importFromFS(this.fs, manifest.entry);
    if (!mod?.default) {
      console.error(`[AppManager] No default export for ${manifest.id}`);
      return;
    }
    const teardown = await mod.default(ctx);

    if (openPath) this.bus.emit({ type: "os.open", path: openPath });
    void teardown;
  }
}
