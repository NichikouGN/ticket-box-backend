import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createOrder, streamOrderUrl } from "../controller/order.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createOrder);
router.get("/:orderId/stream", streamOrderUrl);

export default router;
