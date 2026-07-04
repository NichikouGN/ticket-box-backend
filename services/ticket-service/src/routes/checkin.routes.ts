import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { TicketController } from "../controller/ticket.controller.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { CheckinController } from "../controller/checkin.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["STAFF"]));

router.get("/public-key", TicketController.getPublicKey);
router.post("/verify", CheckinController.verifyTicket);
router.get("/stats/:concertId", CheckinController.getCheckinStats);

export default router;
