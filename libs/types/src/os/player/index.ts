export interface NeoPlayerHost {
  play(src: { url: string }): Promise<void>;
  pause(): void;
  seek(t: number): void;
  setVolume(v: number): void;
}
