import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { cancelConcert, createConcert, updateConcert } from "../controller/organizer.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware("ORGANIZER"));

router.post("/", createConcert);
router.patch("/:id", updateConcert);
router.patch("/:id/cancel", cancelConcert);

export default router;
