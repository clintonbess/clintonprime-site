import type { NeoFileDescriptor, NeoFileType } from "./types/neo-file";

type CapabilityHandler = {
  open: (file: NeoFileDescriptor) => void | Promise<void>;
  // future: icon, label, probe(), defaultAppId, etc.
};

export class CapabilityRegistry {
  private map = new Map<NeoFileType, CapabilityHandler>();

  register(type: NeoFileType, handler: CapabilityHandler) {
    this.map.set(type, handler);
  }

  get(type: NeoFileType): CapabilityHandler | undefined {
    return this.map.get(type);
  }

  open(file: NeoFileDescriptor) {
    const handler = this.map.get(file.type);
    if (!handler)
      throw new Error(`No capability registered for type: ${file.type}`);
    return handler.open(file);
  }
}
