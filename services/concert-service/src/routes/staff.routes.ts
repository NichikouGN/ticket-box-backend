import { Router } from "express";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { OrganizerVipController } from "../controller/organizerVip.controller.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["STAFF", "ORGANIZER"])); //Testing purposes, should be STAFF only

router.patch("/concerts/:concertId/vip-guests/:vipGuestId/check-in", OrganizerVipController.checkInVipGuest);

export default router;
