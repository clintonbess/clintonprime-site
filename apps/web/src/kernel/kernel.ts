import { createEventBus } from "./event-bus";
import { createAudioFS } from "./fs";
import { createPlayerHost } from "./player-host";
import type { NeoContext, NeoAppManifest } from "./types";

export const Kernel = {
  events: createEventBus(),
  fs: createAudioFS(),
  registry: new Map<string, NeoAppManifest>(),

  register(manifest: NeoAppManifest) {
    this.registry.set(manifest.id, manifest);
  },

  async launch(
    id: string,
    mountTarget: HTMLElement,
    audioEl?: HTMLAudioElement
  ) {
    const mf = this.registry.get(id)!;
    const mod = await mf.entry();
    const ctx: NeoContext = {
      id: mf.id,
      manifest: mf,
      fs: this.fs,
      events: this.events,
      player: createPlayerHost(audioEl ?? document.createElement("audio")),
    };
    mod.mount(ctx);
  },
};
