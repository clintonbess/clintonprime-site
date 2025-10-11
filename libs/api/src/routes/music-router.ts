import express from "express";
import fs from "fs";
import path from "path";
import { parseFile } from "music-metadata";
import { __dirname } from "../utils/env-path.js";
import { TracksResponseSchema, MusicTrack, TEST } from "@clintonprime/types";
const router = express.Router();
const mediaDir = path.join(__dirname, "../../public/media");

// Get all tracks (with basic metadata)
router.get("/tracks", async (_req, res) => {
  try {
    const files = fs.readdirSync(mediaDir).filter((f) => f.endsWith(".mp3"));
    const tracks: MusicTrack[] = [];

    for (const file of files) {
      const fullPath = path.join(mediaDir, file);
      const metadata = await parseFile(fullPath);

      tracks.push({
        id: path.basename(file, ".mp3"),
        name: metadata.common.title || path.basename(file),
        artist: metadata.common.artist || "Unknown Artist",
        album: metadata.common.album || "Untitled",
        duration: metadata.format.duration || 0,
        hasCover: !!metadata.common.picture?.length,
        url: `/media/${file}`,
        cover: `/api/music/cover/${encodeURIComponent(file)}`,
      });
    }

    const response = { tracks };
    const parseResult = TracksResponseSchema.safeParse(response);
    if (!parseResult.success) {
      console.error(
        "/tracks response validation failed",
        parseResult.error.format()
      );
      return res.status(500).json({ error: "Invalid response shape" });
    }

    res.json(parseResult.data);
  } catch (err) {
    console.error("Error reading tracks:", err);
    res.status(500).json({ error: "Failed to read tracks" });
  }
});

// Extract embedded cover image
router.get("/cover/:filename", async (req, res) => {
  try {
    const file = decodeURIComponent(req.params.filename);
    const fullPath = path.join(mediaDir, file);

    if (!fs.existsSync(fullPath)) return res.status(404).send("File not found");

    const metadata = await parseFile(fullPath);
    const picture = metadata.common.picture?.[0];

    if (!picture) {
      // fallback placeholder
      return res.redirect("/assets/default-cover.jpg");
    }

    res.setHeader("Content-Type", picture.format);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(picture.data));
  } catch (err) {
    console.error("Error extracting cover:", err);
    res.status(500).send("Failed to extract cover art");
  }
});

export default router;
