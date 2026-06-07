import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createOrder, getOrders } from "../controller/order.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createOrder);
router.get("/", getOrders);

export default router;
