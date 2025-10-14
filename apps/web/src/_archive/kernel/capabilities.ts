import type { osFile } from "@clintonprime/types";

type CapabilityHandler = {
  open: (file: osFile.NeoFileDescriptor) => void | Promise<void>;
  // future: icon, label, probe(), defaultAppId, etc.
};

export class CapabilityRegistry {
  private map = new Map<osFile.NeoFileType, CapabilityHandler>();

  register(type: osFile.NeoFileType, handler: CapabilityHandler) {
    this.map.set(type, handler);
  }

  get(type: osFile.NeoFileType): CapabilityHandler | undefined {
    return this.map.get(type);
  }

  open(file: osFile.NeoFileDescriptor) {
    const handler = this.map.get(file.type);
    if (!handler)
      throw new Error(`No capability registered for type: ${file.type}`);
    return handler.open(file);
  }
}
