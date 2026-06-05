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
  max_per_user: z.coerce.number().int().positive(),
  total_capacity: z.coerce.number().int().positive(),
  sale_start: z.string().datetime().optional().nullable(),
  sale_end: z.string().datetime().optional().nullable(),
});

export const createConcertSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  artists: z.array(z.string().min(1)).min(1),
  venue: z.string().min(1),
  start_time: z.string().datetime(),
  thumbnail_url: z.string().url().optional().nullable(),
  seat_map_svg_url: z.string().url().optional().nullable(),
  ticket_types: z.array(ticketTypeSchema).min(1),
});

export const updateConcertSchema = createConcertSchema.partial().extend({
  ticket_types: z.array(ticketTypeSchema).optional(),
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
  start_time: string;
  status: string;
  thumbnail_url: string | null;
};

export type ConcertDetail = {
  id: string;
  title: string;
  description: string | null;
  artists: string[];
  venue: string;
  start_time: string;
  thumbnail_url: string | null;
  seat_map_svg_url: string | null;
};

export type TicketTypeView = {
  id: string;
  name: string;
  price: number;
  max_per_user: number;
  available_seats: number;
};

export type StockTicketTypeView = {
  id: string;
  name: string;
  price: number;
  total_quantity: number;
  sold_quantity: number;
};
