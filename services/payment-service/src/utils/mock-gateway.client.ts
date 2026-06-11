import crypto from "crypto";
import { AppError } from "../types/appError.types.js";

const paymentGatewayMode = process.env.MOCK_PAYMENT_GATEWAY_MODE ?? "success";
const paymentGatewayBaseUrl = process.env.MOCK_PAYMENT_GATEWAY_URL ?? "http://localhost:3011";

const buildPaymentUrl = (paymentId: string, returnUrl: string, amount: number) => {
  const checkoutUrl = new URL(`/checkout/${paymentId}`, paymentGatewayBaseUrl);
  checkoutUrl.searchParams.set("return_url", returnUrl);
  checkoutUrl.searchParams.set("amount", String(amount));
  return checkoutUrl.toString();
};

export const MockGatewayClient = {
  async createCheckoutLink({
    paymentId,
    orderId,
    amount,
  }: {
    paymentId: string;
    orderId: string;
    amount: number;
  }) {
    if (paymentGatewayMode === "fail") {
      throw new AppError(`Mock payment gateway declined payment for order ${orderId}`, 402);
    }

    if (paymentGatewayMode === "timeout") {
      throw new AppError(`Mock payment gateway timed out for order ${orderId}`, 504);
    }

    const paymentRef = `MOCK-TXN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    return {
      paymentUrl: buildPaymentUrl(
        paymentId,
        `${paymentGatewayBaseUrl}/return/${paymentId}`,
        amount,
      ),
      paymentRef,
    };
  },
};
