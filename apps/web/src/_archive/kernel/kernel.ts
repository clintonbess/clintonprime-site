import { createEventBus } from "./event-bus";
import { createAudioFS } from "./fs";
import { createPlayerHost } from "./player-host";
import type { NeoContext, NeoAppManifest } from "./types";
import { CapabilityRegistry } from "./capabilities";
import type { osFile } from "@clintonprime/types";

export const Kernel = {
  events: createEventBus(),
  fs: createAudioFS(),
  registry: new Map<string, NeoAppManifest>(),
  capabilities: new CapabilityRegistry(),
  _booted: false as boolean,

  register(manifest: NeoAppManifest) {
    this.registry.set(manifest.id, manifest);
  },

  async launch(
    id: string,
    _mountTarget: HTMLElement,
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

  // Kernel capability open
  open(file: osFile.NeoFileDescriptor) {
    return this.capabilities.open(file);
  },

  // Kernel boot: register audio capability to re-emit OS-level event
  boot() {
    if (this._booted) return;
    this._booted = true;
    this.capabilities.register("neo/audio", {
      open: (file) => {
        this.events.emit("neo.audio.open", file);
      },
    });
  },
};
