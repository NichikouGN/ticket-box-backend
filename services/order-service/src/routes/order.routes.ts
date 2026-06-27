import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createOrder, streamOrderConfirm, streamPaymentUrl } from "../controller/order.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createOrder);
router.get("/:orderId/stream/payment-url", streamPaymentUrl);
router.get("/:orderId/stream/order-confirm", streamOrderConfirm);

export default router;
