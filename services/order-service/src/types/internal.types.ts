import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const OutboxEventStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "PROCESSED", "FAILED"]),
});

export type OutboxEventPayload = {
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  idempotencyKey: string;
};

export type OutboxEventType = {
  id: string;
  event_type: string;
  payload: OutboxEventPayload;
  status: "PENDING" | "PROCESSED" | "FAILED";
  retries: number;
  next_retry_at: Date;
  created_at: Date;
};

export type PaymentCreationData = {
  paymentUrl: string;
  paymentDeadline: string;
};

export type PaymentCreationResult = {
  success: boolean;
  message: string;
  data: PaymentCreationData;
};
