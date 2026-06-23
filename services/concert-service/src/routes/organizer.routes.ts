import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import {
  cancelConcert,
  createConcert,
  publishConcert,
  restoreConcert,
  updateConcert,
  createArtists,
  uploadPdfController,
} from "../controller/organizer.controller.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB

router.use(authMiddleware);
router.use(rbacMiddleware("ORGANIZER"));

router.post("/upload-pdf", upload.single("pdf"), uploadPdfController);

router.post("/artists", createArtists);

router.patch("/concerts/:id", updateConcert);
router.patch("/concerts/:id/cancel", cancelConcert);
router.patch("/concerts/:id/publish", publishConcert);
router.patch("/concerts/:id/restore", restoreConcert);
router.post("/concerts", createConcert);

export default router;
