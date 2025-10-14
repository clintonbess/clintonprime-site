import type { NeoPlayerHost } from "./types";

export function createPlayerHost(audioEl: HTMLAudioElement): NeoPlayerHost {
  return {
    async play(src) {
      audioEl.src = src.url;
      await audioEl.play();
    },
    pause() {
      audioEl.pause();
    },
    seek(t) {
      audioEl.currentTime = t;
    },
    setVolume(v) {
      audioEl.volume = v;
    },
  };
}
