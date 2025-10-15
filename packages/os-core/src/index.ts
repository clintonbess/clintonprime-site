export * from "./fs/types";
export { MemoryFS } from "./fs/memory";
export { OverlayFS } from "./fs/overlay";
export { MountableFS } from "./fs/router";
export { EventBus } from "./events/bus";

// convenience starter
import { MountableFS } from "./fs/router";
import { FS } from "./fs/types";

export function createFS(): MountableFS {
  return new MountableFS();
}

// helper to mount quickly
export function mount(router: MountableFS, prefix: string, fs: FS) {
  return router.mount(prefix, fs);
}
