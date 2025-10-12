import type { NeoFS } from "./types";
import type { osFile } from "@clintonprime/types";

export function createAudioFS(): NeoFS {
  return {
    audio: {
      async fromLocalFile(file: File): Promise<osFile.NeoAudioFileDescriptor> {
        // Support either .mp3 or a tiny .neoaudio.json bundle
        if (file.name.endsWith(".neoaudio.json")) {
          const text = await file.text();
          const obj = JSON.parse(text);
          // Expect shape: { name, url } (url can be data: or remote)
          return {
            type: "neo/audio",
            name: obj.name ?? file.name,
            mime: "audio/mpeg",
            size: 0,
            blobUrl: obj.url,
            meta: obj,
          };
        }

        // default: raw mp3
        const url = URL.createObjectURL(file);
        const desc: osFile.NeoAudioFileDescriptor = {
          type: "neo/audio",
          name: file.name,
          mime: (file.type as any) || "audio/mpeg",
          size: file.size,
          blobUrl: url,
          meta: {
            lastModified: file.lastModified,
          },
        };
        return desc;
      },
    },
  };
}
