import express from "express";
import morgan from "morgan";
import spotifyRouter from "./routes/spotify-router.js";
import musicRouter from "./routes/music-router.js";
import { loadDotenvFromNearest } from "./utils/env-path.js";
import path from "path";
loadDotenvFromNearest();

const app = express();

app.use(morgan("dev"));

const mediaDir = path.join(__dirname, "../public/media");
app.use(
  "/media",
  express.static(mediaDir, {
    setHeaders: (res, filePath) => {
      console.log("settings header for this filepath", filePath);
      if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Accept-Ranges", "bytes");
      }
    },
  })
);

app.use("/api/spotify", spotifyRouter);
app.use("/api/music", musicRouter);

app.get("/", (_req, res) => {
  res.send("clintonprime API online");
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () =>
  console.log(`API running on http://127.0.0.1:${PORT}`)
);
