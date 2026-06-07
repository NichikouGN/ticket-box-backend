import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["pending", "paid", "failed", "expired"]).optional(),
  concertId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const createOrderItemSchema = z.object({
  concertId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const createOrderSchema = z.object({
  paymentMethod: z.enum(["momo", "zalopay"]),
  data: z.array(createOrderItemSchema).min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;

export type OrderStatus = "pending" | "paid" | "failed" | "expired";

export type OrderListItem = {
  id: string;
  user_email: string;
  concert_title: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
};

export type OrderResponse = {
  order_id: string;
  total_price: number;
  payment_deadline: string;
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
