import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { OrganizerConcertController } from "../controller/organizerConcert.controller.js";
import { OrganizerArtistController } from "../controller/organizerArtist.controller.js";
import { OrganizerVipController } from "../controller/organizerVip.controller.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB

router.use(authMiddleware);
router.use(rbacMiddleware(["ORGANIZER"]));

router.post("/artists", OrganizerArtistController.createArtists);

router.post("/concerts/:concertId/link-artist", OrganizerArtistController.linkArtistToConcert);
router.post("/concerts/:concertId/generate-bio", upload.single("pdf"), OrganizerArtistController.generateArtistBios);

router.get("/concerts/:concertId/bio-review", OrganizerArtistController.getAwaitingReviewBios);
router.patch("/concerts/:concertId/bio-review/:artistId", OrganizerArtistController.updateBioStatus);

router.get("/concerts/:concertId/vip-guests", OrganizerVipController.getVipGuests);
router.post("/concerts/:concertId/vip-guests/import", upload.single("csv"), OrganizerVipController.importVipGuests);

router.patch("/concerts/:concertId", OrganizerConcertController.updateConcert);
router.patch("/concerts/:concertId/update-status", OrganizerConcertController.updateConcertStatus);
router.post("/concerts", OrganizerConcertController.createConcert);

export default router;
