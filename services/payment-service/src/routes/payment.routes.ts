import { Router } from "express";
import { getPaymentUrl } from "../controller/payment.controller.js";
import { internalAuthMiddleware } from "../middleware/internalAuth.middleware.js";

const router = Router();

router.use(internalAuthMiddleware);
router.get("/payments/:orderId/url", getPaymentUrl);

export default router;
