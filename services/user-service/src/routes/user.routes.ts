import { Router } from "express";
import { getProfile } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);
router.get("/profile", getProfile);

export default router;
