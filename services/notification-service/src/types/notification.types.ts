import { z } from "zod";

export const NotificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const uuidSchema = z.string().uuid();

export type NotificationPayload = {
  orderId: string;
  userInfo: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  };
  concertData: {
    id: string;
    title: string;
    venue: string;
    eventDate: string;
  };
  ticketTypes: {
    ticketTypeId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
};
