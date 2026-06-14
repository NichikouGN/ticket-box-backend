import { Router } from "express";
import { updateOutboxEventStatus } from "../controller/internal.controller.js";
import { internalAuthMiddleware } from "../middleware/internalAuth.middleware.js";

const router = Router();

router.use(internalAuthMiddleware);
router.patch("/outbox/:eventId/status", updateOutboxEventStatus);

export default router;
