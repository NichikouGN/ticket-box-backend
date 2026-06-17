import { Router } from "express";
import { handlePaymentFailed } from "../controller/internal.controller.js";
import { internalAuthMiddleware } from "../middleware/internalAuth.middleware.js";

const router = Router();

router.use(internalAuthMiddleware);
router.patch("/orders/:orderId/payment-failed", handlePaymentFailed);

export default router;
