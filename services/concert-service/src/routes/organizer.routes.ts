import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { cancelConcert, createConcert, updateConcert } from "../controller/organizer.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware("ORGANIZER"));

router.post("/concerts", createConcert);
router.patch("/concerts/:id", updateConcert);
router.patch("/concerts/:id/cancel", cancelConcert);

export default router;
