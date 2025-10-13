import { parseBuffer } from "music-metadata";
import axios from "axios";

export async function getAudioMetadata(url: string, name: string) {
  try {
    const { data } = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: 10000,
    });
    const buf = Buffer.from(data);
    const meta = await parseBuffer(buf, { mimeType: "audio/mpeg" });

    const picture = meta.common.picture?.[0];
    const cover =
      picture &&
      `data:${picture.format};base64,${Buffer.from(picture.data).toString(
        "base64"
      )}`;

    return {
      artist: meta.common.artist ?? undefined,
      album: meta.common.album ?? undefined,
      duration: meta.format.duration ?? undefined,
      cover, // ✅ valid Base64 string
    };
  } catch (err) {
    console.warn(`[getAudioMetadata] failed for ${name}`, err);
    return {};
  }
}
