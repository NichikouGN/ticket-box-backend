import { Router } from "express";
import { internalAuthMiddleware } from "../middleware/internalAuth.middleware.js";
import { InternalController } from "../controller/internal.controller.js";

const router = Router();
router.use(internalAuthMiddleware);

router.get("/users/:userId", InternalController.getUserById);
export default router;
