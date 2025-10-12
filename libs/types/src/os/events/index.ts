export type NeoEventName = "neo.audio.open" | string;

export interface NeoEventMap {
  "neo.audio.open": import("../file/neo-file.js").NeoAudioFileDescriptor;
}

export type NeoEventPayload<T extends NeoEventName> =
  T extends keyof NeoEventMap ? NeoEventMap[T] : any;
