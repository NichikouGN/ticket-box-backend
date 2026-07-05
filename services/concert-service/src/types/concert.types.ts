import { z } from "zod";

export const concertIdParamSchema = z.object({
  concertId: z.string().uuid(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const ticketTypeSchema = z.object({
  name: z.string("Name must be a non-empty string").min(1),
  price: z.coerce.number("Price must be a valid number").int().nonnegative(),
  maxPerUser: z.coerce.number("Max per user must be a valid number").int().positive(),
  totalCapacity: z.coerce.number("Total capacity must be a valid number").int().positive(),
  saleStart: z.string().datetime("Sale start must be a valid datetime"),
  saleEnd: z.string().datetime("Sale end must be a valid datetime"),
});

export const createConcertSchema = z
  .object({
    title: z.string("Title must be a non-empty string").min(1),
    description: z.string("Description must be a valid string").optional().nullable(),
    venue: z.string("Venue must be a non-empty string").min(1),
    eventDate: z.string("Event date must be a valid datetime").datetime(),
    coverImage: z
      .string("Cover image must be a valid URL")
      .url("Cover image must be a valid URL")
      .optional()
      .nullable(),
    seatMapSvg: z
      .string("Seat map SVG must be a valid URL")
      .url("Seat map SVG must be a valid URL")
      .optional()
      .nullable(),
    ticketTypes: z.array(ticketTypeSchema).min(1),
  })
  .strict();

export const updateConcertSchema = createConcertSchema.partial().extend({
  ticketTypes: z.array(ticketTypeSchema).optional(),
});

export const updateConcertStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]),
});

export type CreateConcertInput = z.infer<typeof createConcertSchema>;
export type UpdateConcertInput = z.infer<typeof updateConcertSchema>;
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;
export type UpdateConcertStatusInput = z.infer<typeof updateConcertStatusSchema>;

export type ConcertListItem = {
  id: string;
  title: string;
  artists: string[];
  venue: string;
  eventDate: string;
  status: string;
  coverImage: string | null;
};

export type ConcertDetail = {
  id: string;
  title: string;
  description: string | null;
  artists: string[];
  venue: string;
  eventDate: string;
  coverImage: string | null;
  seatMapSvg: string | null;
};

export type TicketTypeView = {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  soldQuantity: number;
  maxPerUser: number;
};

export type StockTicketTypeView = {
  id: string;
  name: string;
  stock: number;
};
