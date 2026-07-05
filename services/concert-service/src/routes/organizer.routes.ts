import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { OrganizerController } from "../controller/organizer.controller.js";
import { ArtistController } from "../controller/artist.controller.js";
import { VipController } from "../controller/vip.controller.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB

router.use(authMiddleware);
router.use(rbacMiddleware(["ORGANIZER"]));

router.post("/artists", ArtistController.createArtists);

router.post("/concerts/:concertId/link-artist", ArtistController.linkArtistToConcert);
router.post("/concerts/:concertId/generate-bio", upload.single("pdf"), ArtistController.generateArtistBios);

router.get("/concerts/:concertId/bio-review", ArtistController.getAwaitingReviewBios);
router.patch("/concerts/:concertId/bio-review/:artistId", ArtistController.updateBioStatus);

router.get("/concerts/:concertId/vip-guests", VipController.getVipGuests);
router.post("/concerts/:concertId/vip-guests/import", upload.single("csv"), VipController.importVipGuests);

router.patch("/concerts/:concertId", OrganizerController.updateConcert);
router.patch("/concerts/:concertId/update-status", OrganizerController.updateConcertStatus);
router.post("/concerts", OrganizerController.createConcert);

export default router;
