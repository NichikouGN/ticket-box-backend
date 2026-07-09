import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const uuidTicketSchema = z.object({
  ticketId: uuidSchema,
});

export const uuidConcertSchema = z.object({
  concertId: uuidSchema,
});

const paymentMethod = ["stripe"];
export const paymentMethodSchema = z.enum(paymentMethod);

export const createOrderSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  // idempotencyKey: z.string().min(1),
});

export const createPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  // idempotencyKey: z.string().min(1),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export type PaymentStatus = "PROCESSING" | "PENDING_PAYMENT" | "COMPLETED" | "FAILED" | "EXPIRED";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

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
  status: PaymentStatus;
  payment_session_id: string | null;
  payment_intent_id: string | null;
  payment_url: string | null;
  created_at: string;
  updated_at: string;
  payment_deadline: string;
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

export type OutboxEventType = {
  id: string;
  event_type: string;
  payload: Object;
  status: "PENDING" | "PROCESSED" | "FAILED";
  retries: number;
  next_retry_at: Date;
  created_at: Date;
};
