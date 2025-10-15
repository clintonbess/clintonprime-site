import express from "express";
import morgan from "morgan";
import spotifyRouter from "./routes/spotify-router.js";
import musicRouter from "./routes/music-router.js";
import { loadDotenvFromNearest } from "./utils/env-path.js";
import path from "path";
import { __dirname } from "./utils/env-path.js";
import { ZodError } from "zod";

loadDotenvFromNearest();

const app = express();

app.use(morgan("dev"));

app.use(express.json({ limit: "5mb" })); // ✅ parse application/json
app.use(express.urlencoded({ extended: false }));

const mediaDir = path.join(__dirname, "../../public/media");
app.use(
  "/media",
  express.static(mediaDir, {
    setHeaders: (res, filePath) => {
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

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ code: "BAD_REQUEST", issues: err.issues });
    }
    if (err?.message === "NOT_FOUND") {
      return res.status(404).json({ code: "NOT_FOUND" });
    }
    console.error(err);
    res.status(500).json({ code: "INTERNAL_ERROR" });
  }
);

export default app;
