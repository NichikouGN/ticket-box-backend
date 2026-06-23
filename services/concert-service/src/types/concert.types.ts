import { z } from "zod";

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const ticketTypeSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().int().nonnegative(),
  maxPerUser: z.coerce.number().int().positive(),
  totalCapacity: z.coerce.number().int().positive(),
  saleStart: z.string().datetime(),
  saleEnd: z.string().datetime(),
});

export const createConcertSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    venue: z.string().min(1),
    eventDate: z.string().datetime(),
    thumbnailUrl: z.string().url().optional().nullable(),
    seatMapSvgUrl: z.string().url().optional().nullable(),
    ticketTypes: z.array(ticketTypeSchema).min(1),
  })
  .strict();

export const updateConcertSchema = createConcertSchema.partial().extend({
  ticketTypes: z.array(ticketTypeSchema).optional(),
});

export const cancelConcertSchema = z.object({
  reason: z.string().min(1).optional().nullable(),
});

export type CreateConcertInput = z.infer<typeof createConcertSchema>;
export type UpdateConcertInput = z.infer<typeof updateConcertSchema>;
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;

export type ConcertListItem = {
  id: string;
  title: string;
  artists: string[];
  venue: string;
  eventDate: string;
  status: string;
  thumbnailUrl: string | null;
};

export type ConcertDetail = {
  id: string;
  title: string;
  description: string | null;
  artists: string[];
  venue: string;
  eventDate: string;
  thumbnailUrl: string | null;
  seatMapSvgUrl: string | null;
};

export type TicketTypeView = {
  id: string;
  name: string;
  price: number;
  maxPerUser: number;
};

export type StockTicketTypeView = {
  id: string;
  name: string;
  stock: number;
};
