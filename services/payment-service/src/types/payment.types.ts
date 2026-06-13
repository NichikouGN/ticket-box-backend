import { z } from "zod";

export const uuidSchema = z.string().uuid();

const paymentMethod = ["stripe"];
export const paymentMethodSchema = z.enum(paymentMethod);

export const createOrderSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  idempotencyKey: z.string().min(1),
});

export const createPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  idempotencyKey: z.string().min(1),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export type PaymentStatus = "PROCESSING" | "PENDING_PAYMENT" | "COMPLETED" | "FAILED" | "EXPIRED";

export type CheckoutSessionResponse = {
  sessionId: string;
  paymentId: string;
  totalPrice: number;
  paymentDeadline: string;
  paymentUrl: string;
};

export type PaymentRecord = {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  idempotency_key: string;
  status: PaymentStatus;
  payment_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePaymentResponse = {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  paymentUrl: string;
  paymentSessionId: string | null;
  paymentDeadline: string;
};

export type PaymentDetailResponse = {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  paymentSessionId: string | null;
  processedAt: string;
};

export type OrderResponse = {
  orderId: string;
  totalPrice: number;
  paymentDeadline: string;
  paymentUrl: string;
};
