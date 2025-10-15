import { Router } from "express";
import { FsController } from "./fs-controller";
import multer from "multer";
const upload = multer();
export const fsRoutes = Router();

fsRoutes.get("/list", FsController.list);
fsRoutes.get("/node/:id", FsController.stat);
fsRoutes.post("/folder", FsController.createFolder);
fsRoutes.patch("/node/:id/rename", FsController.rename);
fsRoutes.post("/move", FsController.move);
fsRoutes.delete("/node/:id", FsController.remove);

// stubs for media
fsRoutes.get("/node/:id/stream", FsController.stream);
fsRoutes.post("/upload", upload.single("file"), FsController.upload);
fsRoutes.post("/upload/init", FsController.uploadInit);
