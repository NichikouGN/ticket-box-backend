import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { NotificationController } from "../controller/notification.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/notifications", NotificationController.getNotifications);
router.get("/stream", NotificationController.streamNotificationUpdates);

export default router;
