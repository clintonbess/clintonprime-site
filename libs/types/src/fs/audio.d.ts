import type { NeoFileNode, NeoFileBase } from "../neo";
/** Common metadata extracted from ID3 or waveform analyzers */
export interface NeoAudioMeta {
    artist?: string;
    album?: string;
    duration?: number;
    cover?: string | null;
}
/** Core shape of an audio file node */
export interface NeoAudioFileBase extends NeoFileBase<NeoAudioMeta> {
    /** Discriminator for kernel + explorer routing */
    kind: "neo/audio";
    /** MIME type for S3 / browser playback */
    mime: "audio/mpeg" | "audio/mp3";
    /** Fully qualified or presigned S3 URL */
    url: string;
    size?: number;
    meta?: NeoAudioMeta;
}
/** Typed file node for audio */
export type NeoAudioFileNode = NeoFileNode<NeoAudioFileBase>;
