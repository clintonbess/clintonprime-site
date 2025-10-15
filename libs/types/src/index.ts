export * from "./schemas.js";
export * from "./neo.js";
export * as osFile from "./os/file/index.js";
export * as osEvents from "./os/events/index.js";
export * as osFs from "./os/fs/index.js";
export * as osPlayer from "./os/player/index.js";
export * as osApp from "./os/app/index.js";
export * as osWindow from "./os/windowing/index.js";
export * as osKernel from "./os/kernel/index.js";
export * from "./fs/index.js";

// export * as fs from "./fs/index.js";
export * from "./os/fs/index.js"; // runtime helpers under os/fs/index
export * from "./os/app/index.js"; // runtime helpers under os/app/index

// Re-export core types (types only; erased at runtime)
export type { FS, Stat } from "./os/fs.js";
export type {
  AppManifest,
  EventBus,
  UIWindow,
  UI,
  AppContext,
  OSEvent,
} from "./os/app.js";
