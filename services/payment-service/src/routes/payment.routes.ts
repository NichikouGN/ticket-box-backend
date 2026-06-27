import { Router } from "express";
import { getPaymentUrl } from "../controller/payment.controller.js";
import { internalAuthMiddleware } from "../middleware/internalAuth.middleware.js";

const router = Router();

router.use(internalAuthMiddleware); // Apply internal authentication middleware to all routes in this router
router.get("/payments/:orderId/url", getPaymentUrl);
// router.post("/payments", createPayment);
// router.get("/payments/:paymentId", getPayment);

export default router;
