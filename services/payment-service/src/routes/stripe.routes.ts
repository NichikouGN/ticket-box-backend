import express from "express";
import { logPaymentEvent } from "../controller/stripe.controller.js";
const router = express.Router();

router.post("/", logPaymentEvent);

export default router;
