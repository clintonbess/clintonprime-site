import type { NeoAudioFileDescriptor } from "../types/neo-file";

export async function normalizeMp3File(
  file: File
): Promise<NeoAudioFileDescriptor> {
  if (file.type !== "audio/mpeg") {
    const isMp3 = /\.mp3$/i.test(file.name);
    if (!isMp3)
      throw new Error(
        `Only MP3 files are supported for now. Got ${file.type} (${file.name})`
      );
  }
  const blobUrl = URL.createObjectURL(file);
  return {
    type: "neo/audio",
    name: file.name,
    mime: "audio/mpeg",
    size: file.size,
    blobUrl,
  };
}
