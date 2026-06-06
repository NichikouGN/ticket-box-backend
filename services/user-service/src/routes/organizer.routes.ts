import { Router } from "express";
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../controller/organizer.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware("ORGANIZER"));

router.get("/", getAllUsers);
router.patch("/:targetId/role", updateUserRole);
router.patch("/:targetId/status", updateUserStatus);

router.use((req, res) => {
  console.log("Auth Routes: Unhandled request:", req.method, req.originalUrl);
  res.status(404).json({ success: false, message: "Not Found" });
});

export default router;
