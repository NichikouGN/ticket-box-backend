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
router.patch("/:id/role", updateUserRole);
router.patch("/:id/status", updateUserStatus);

router.use((req, res) => {
  console.log("Auth Routes: Unhandled request:", req.method, req.originalUrl);
  res.status(404).json({ message: "Not Found" });
});

export default router;
