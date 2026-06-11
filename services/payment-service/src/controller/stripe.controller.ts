import Stripe from "stripe";
import { stripe } from "../infrastructure/stripe.client.js";
import type { Response, Request } from "express";
import dotenv from "dotenv";
import { StripeService } from "../services/stripe.service.js";
import { AppError } from "../types/appError.types.js";
dotenv.config();

export const logPaymentEvent = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  try {
    const event: Stripe.Event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
    await StripeService.handleWebhookEvent(event);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
  res.json({ success: true });
};
