export type NeoFileType = "neo/audio";

export interface NeoAudioFileDescriptor {
  type: "neo/audio";
  name: string;
  mime: "audio/mpeg";
  size: number;
  /** Local object URL for playback; callers must revoke when done if they created it. */
  blobUrl: string;
  /** Optional metadata gathered at normalization time. */
  meta?: {
    durationMs?: number;
    artist?: string;
    album?: string;
    title?: string;
    bitrateKbps?: number;
    // artwork hints (optional)
    coverUrl?: string;
    cover?: string;
    image?: string;
    albumArtUrl?: string;
    coverBlobUrl?: string;
    [key: string]: any;
  };
}

export type NeoFileDescriptor = NeoAudioFileDescriptor;
