import { Router } from "express";
import { UserController } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/profile", UserController.getProfile);

export default router;
