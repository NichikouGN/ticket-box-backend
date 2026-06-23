import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { OrganizerController } from "../controller/organizer.controller.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB

router.use(authMiddleware);
router.use(rbacMiddleware("ORGANIZER"));

router.post("/upload-pdf", upload.single("pdf"), OrganizerController.uploadPdf);

router.post("/artists", OrganizerController.createArtists);

router.post("/concerts", OrganizerController.createConcert);

// router.patch("/concerts/:id", OrganizerController.updateConcert);
// router.patch("/concerts/:id/cancel", OrganizerController.cancelConcert);
// router.patch("/concerts/:id/publish", OrganizerController.publishConcert);
// router.patch("/concerts/:id/restore", OrganizerController.restoreConcert);

export default router;
