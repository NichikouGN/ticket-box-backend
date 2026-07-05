import { Router } from "express";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { VipController } from "../controller/vip.controller.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["STAFF"])); //Testing purposes, should be STAFF only

router.get("/concerts/:concertId/vip-guests", VipController.getVipGuests);
router.patch("/concerts/:concertId/vip-guests/:vipGuestId/check-in", VipController.checkInVipGuest);

export default router;
