import { AppError } from "../types/appError.types.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const paymentClient = axios.create({
  baseURL: (process.env.PAYMENT_SERVICE_URL || "http://localhost:3004") + "/internal",
});

paymentClient.interceptors.request.use((config) => {
  console.log(
    "Adding internal API key to request headers for payment service communication, ",
    process.env.INTERNAL_API_KEY,
  );
  config.headers["x-internal-api-key"] = process.env.INTERNAL_API_KEY;
  return config;
});
