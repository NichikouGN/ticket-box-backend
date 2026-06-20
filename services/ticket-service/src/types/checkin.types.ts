import { z } from "zod";

const uuidSchema = z.string().uuid();

export const ticketInfoSchema = z.object({
  ticketId: uuidSchema,
  userId: uuidSchema,
  concertId: uuidSchema,
  ticketTypeId: uuidSchema,
});
