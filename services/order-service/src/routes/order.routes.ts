import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createOrder, getOrderUrl } from "../controller/order.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createOrder);
router.get("/:orderId/status", getOrderUrl);

export default router;
