import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});
