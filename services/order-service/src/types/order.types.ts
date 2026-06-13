import { z } from "zod";

export const uuidSchema = z.string().uuid();

const paymentMethod = ["stripe"];
export const paymentMethodSchema = z.enum(paymentMethod);

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["PROCESSING", "COMPLETED", "FAILED", "EXPIRED"]).optional(),
  concertId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const createOrderItemSchema = z.object({
  concertId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const createOrderSchema = z.object({
  paymentMethod: paymentMethodSchema,
  data: z.array(createOrderItemSchema).min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;

export type OrderStatus = "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";

export type OrderListItem = {
  id: string;
  userEmail: string;
  concertTitle: string;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
};

export type OrderResponse = {
  status: OrderStatus;
  orderId: string;
  totalPrice: number;
  paymentDeadline: string;
  paymentUrl: string;
};

export type TicketTypeCatalogItem = {
  id: string;
  name: string;
  price: number;
  maxPerUser: number;
};

export type StockItem = {
  concertId: string;
  ticketTypeId: string;
  quantity: number;
  maxPerUser: number;
  price: number;
};
