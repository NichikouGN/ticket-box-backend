import { Router } from "express";
import { createPayment, getPayment } from "../controller/payment.controller.js";

const router = Router();

router.post("/", createPayment);
router.get("/:paymentId", getPayment);

export default router;
