export type NeoFileType = "neo/audio" | "neo/clip" | string;

export interface NeoFileDescriptor {
  id: string;
  name: string;
  type: NeoFileType;
  meta?: Record<string, any>;
  blobUrl?: string;
  cached?: boolean;
}

export interface NeoAppManifest {
  id: string;
  name: string;
  entry: () => Promise<{ mount(ctx: NeoContext): void; unmount?: () => void }>;
}

export interface NeoEventBus {
  on<T = any>(topic: string, handler: (payload: T) => void): () => void;
  emit<T = any>(topic: string, payload?: T): void;
  ask<TReq = any, TRes = any>(
    topic: string,
    payload?: TReq,
    timeoutMs?: number
  ): Promise<TRes>;
}

export interface NeoFS {
  audio: {
    fromLocalFile(file: File): Promise<NeoFileDescriptor>; // dnd
  };
}

export interface NeoPlayerHost {
  play(src: { url: string }): Promise<void>;
  pause(): void;
  seek(t: number): void;
  setVolume(v: number): void;
}

export interface NeoContext {
  id: string;
  manifest: NeoAppManifest;
  fs: NeoFS;
  events: NeoEventBus;
  player: NeoPlayerHost;
}

// Generic Neo file model (specialized for music)
export type NeoKind = "neo/audio" | "neo/video" | "neo/project" | string;

export interface NeoFileBase {
  id: string;
  name: string;
  kind: NeoKind;
  cover?: string;
  tags?: string[];
  meta?: Record<string, any>;
}

export interface NeoFileMusic extends NeoFileBase {
  kind: "neo/audio";
  artist: string;
  album?: string;
  source: {
    url: string; // blob: or https:
    origin: "local" | "spotify" | "remote";
  };
}
