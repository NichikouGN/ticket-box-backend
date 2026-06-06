import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import {
  cancelConcert,
  createConcert,
  publishConcert,
  restoreConcert,
  updateConcert,
} from "../controller/organizer.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware("ORGANIZER"));

router.post("/", createConcert);
router.patch("/:id", updateConcert);
router.patch("/:id/cancel", cancelConcert);
router.patch("/:id/publish", publishConcert);
router.patch("/:id/restore", restoreConcert);

export default router;
