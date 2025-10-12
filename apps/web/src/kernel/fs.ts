import type { NeoFS, NeoFileDescriptor } from "./types";

export function createAudioFS(): NeoFS {
  return {
    audio: {
      async fromLocalFile(file: File): Promise<NeoFileDescriptor> {
        // Support either .mp3 or a tiny .neoaudio.json bundle
        if (file.name.endsWith(".neoaudio.json")) {
          const text = await file.text();
          const obj = JSON.parse(text);
          // Expect shape: { name, url } (url can be data: or remote)
          return {
            id: crypto.randomUUID(),
            name: obj.name ?? file.name,
            type: "neo/audio",
            meta: obj,
            blobUrl: obj.url,
            cached: true,
          };
        }

        // default: raw mp3
        const url = URL.createObjectURL(file);
        const desc: NeoFileDescriptor = {
          id: crypto.randomUUID(),
          name: file.name,
          type: "neo/audio",
          meta: {
            size: file.size,
            lastModified: file.lastModified,
            mime: file.type || "audio/mpeg",
          },
          blobUrl: url,
          cached: true,
        };
        return desc;
      },
    },
  };
}
