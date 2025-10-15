import { type FS } from "./fs";
import React from "react";

export interface AppManifest {
  id: string;
  name: string;
  icon: string;
  entry: string;
  associations?: string[];
  window?: {
    title?: string;
    width?: number;
    height?: number;
    resizable?: boolean;
  };
}

export type OSEvent =
  | { type: "os.open"; path: string }
  | { type: "os.download"; path: string }
  | { type: "log.append"; path: string; text: string };

export interface EventBus {
  emit(e: OSEvent): void;
  on<T extends OSEvent["type"]>(
    type: T,
    fn: (e: Extract<OSEvent, { type: T }>) => void
  ): () => void;
}

export interface UIWindow {
  mount(node: React.ReactNode): void;
  setTitle(title: string): void;
  focus(): void;
  close(): void;
}

export interface UI {
  openWindow(opts: { title?: string }): Promise<UIWindow>;
  renderMarkdown(
    src: string,
    style?: "plain" | "code" | "md"
  ): Promise<HTMLElement>;
}

export interface AppContext {
  manifest: AppManifest;
  fs: FS;
  bus: EventBus;
  ui: UI;
  canOpen(path: string): boolean;
}
