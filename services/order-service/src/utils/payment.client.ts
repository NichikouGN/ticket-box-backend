import { AppError } from "../types/appError.types.js";
import dotenv from "dotenv";
dotenv.config();

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL ?? "http://localhost:3005";
export const PaymentClient = {
  async createPayment({
    orderId,
    userId,
    amount,
    paymentMethod,
    idempotencyKey,
  }: {
    orderId: string;
    userId: string;
    amount: number;
    paymentMethod: string;
    idempotencyKey: string;
  }) {
    const response = await fetch(`${PAYMENT_SERVICE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        orderId,
        userId,
        amount,
        paymentMethod,
      }),
    });

    if (!response.ok) {
      throw new AppError(`Payment service request failed with status ${response.status}`, 502);
    }

    return (await response.json()) as {
      paymentUrl: string;
      paymentDeadline: string;
    };
  },
};
