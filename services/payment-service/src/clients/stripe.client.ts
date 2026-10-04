import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config({quiet: true});
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});
