import express from "express";
import { handleWebhook } from "../controller/stripe.controller.js";
const router = express.Router();

router.post("/", handleWebhook);

export default router;
