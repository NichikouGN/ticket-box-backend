import { z } from "zod";
import { ticketInfoSchema } from "../types/checkin.types.js";
import type { Request, Response } from "express";
import { TicketService } from "../services/ticket.service.js";
import { uuidConcertSchema } from "../types/ticket.types.js";

export const CheckinController = {
  async verifyTicket(req: Request, res: Response) {
    const parsedBody = ticketInfoSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res
        .status(400)
        .json({ error: parsedBody.error.issues[0]?.message ?? "Invalid input" });
    }

    const { ticketId, userId, concertId, ticketTypeId } = parsedBody.data as z.infer<
      typeof ticketInfoSchema
    >;

    await TicketService.verifyTicket({ ticketId, userId, concertId, ticketTypeId });
  },

  async getCheckinStats(req: Request, res: Response) {
    const parsedParams = uuidConcertSchema.safeParse(req.params.concertId);
    if (!parsedParams.success) {
      return res
        .status(400)
        .json({ error: parsedParams.error.issues[0]?.message ?? "Invalid input" });
    }

    const concertId = parsedParams.data.concertId as string;

    const stats = await TicketService.getCheckinStats(concertId);
    return res.status(200).json(stats);
  },
};
