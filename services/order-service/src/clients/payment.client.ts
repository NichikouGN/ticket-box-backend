import { AppError } from "../types/appError.types.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const paymentClient = axios.create({
  baseURL: process.env.PAYMENT_SERVICE_URL + "/internal" || "http://localhost:3005/internal",
});

paymentClient.interceptors.request.use((config) => {
  console.log(
    "Adding internal API key to request headers for payment service communication, ",
    process.env.INTERNAL_API_KEY,
  );
  config.headers["x-internal-api-key"] = process.env.INTERNAL_API_KEY;
  return config;
});

// const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL ?? "http://localhost:3005";

// export const PaymentClient = {
//   /**
//    * Creates a payment by sending a request to the payment service.
//    * @param param0 Object containing orderId, userId, amount, paymentMethod, and idempotencyKey for creating a payment
//    * @returns An object containing the payment URL and payment deadline returned from the payment service
//    * @throws AppError if the payment service request fails or returns an invalid
//    */
//   async createPayment({
//     orderId,
//     userId,
//     amount,
//     paymentMethod,
//     idempotencyKey,
//   }: {
//     orderId: string;
//     userId: string;
//     amount: number;
//     paymentMethod: string;
//     idempotencyKey: string;
//   }) {
//     const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Idempotency-Key": idempotencyKey,
//       },
//       body: JSON.stringify({
//         orderId,
//         userId,
//         amount,
//         paymentMethod,
//       }),
//     });

//     if (!response.ok) {
//       throw new AppError(`Payment service request failed with status ${response.status}`, 502);
//     }

//     const payload = (await response.json()) as {
//       success: boolean;
//       message: string;
//       data?: {
//         paymentUrl: string;
//         paymentDeadline: string;
//       };
//     };

//     if (!payload.data) {
//       throw new AppError("Payment service returned an invalid payload", 502);
//     }

//     return {
//       paymentUrl: payload.data.paymentUrl,
//       paymentDeadline: payload.data.paymentDeadline,
//     };
//   },
// };
