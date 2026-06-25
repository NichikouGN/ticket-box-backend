import { z } from "zod";
import { ticketInfoSchema } from "../types/checkin.types.js";
import type { Request, Response } from "express";
import { TicketService } from "../services/ticket.service.js";
import { uuidConcertSchema } from "../types/ticket.types.js";
import { AppError } from "../types/appError.types.js";

export const CheckinController = {
  async verifyTicket(req: Request, res: Response) {
    try {
      const parsedBody = ticketInfoSchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new AppError(parsedBody.error.issues[0]?.message ?? "Invalid input", 400);
      }

      const { ticketId, userId, concertId, ticketTypeId } = parsedBody.data as z.infer<typeof ticketInfoSchema>;
      const staffId = req.user?.userId; // Assuming the authenticated user's ID is available in req.user

      await TicketService.verifyTicket({ ticketId, userId, concertId, ticketTypeId });
      await TicketService.markTicketAsUsed(ticketId, staffId);

      return res.status(200).json({ success: true, message: "Ticket verified successfully." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      return res.status(500).json({ success: false, error: "Error verifying ticket." });
    }
  },

  async getCheckinStats(req: Request, res: Response) {
    try {
      const parsedParams = uuidConcertSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError(parsedParams.error.issues[0]?.message ?? "Invalid input", 400);
      }

      const concertId = parsedParams.data.concertId as string;

      const stats = await TicketService.getCheckinStats(concertId);
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      return res.status(500).json({ success: false, error: "Error fetching check-in stats." });
    }
  },
};
