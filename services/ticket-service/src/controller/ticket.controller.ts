import type { Request, Response } from "express";
import { TicketService } from "../services/ticket.service.js";
import { AppError } from "../types/appError.types.js";
import { uuidConcertSchema, uuidTicketSchema } from "../types/ticket.types.js";

export const TicketController = {
  async getPublicKey(req: Request, res: Response) {
    try {
      const publicKey = await TicketService.getPublicKey();
      return res.status(200).json({ success: true, data: { publicKey } });
    } catch (error) {
      console.error("Error fetching public key:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
  async getTickets(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const tickets = await TicketService.getTickets(userId);

      return res.status(200).json({ success: true, data: tickets });
    } catch (error) {
      console.error("Error fetching tickets:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async getTicketById(req: Request, res: Response) {
    try {
      const parsedParams = uuidTicketSchema.safeParse(req.params);

      if (!parsedParams.success) {
        throw new AppError("Invalid ticket ID format.", 400);
      }

      const ticketId = parsedParams.data.ticketId;
      const result = await TicketService.getTicketById(ticketId);

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  async getTicketsByConcertId(req: Request, res: Response) {
    try {
      const parsedParams = uuidConcertSchema.safeParse(req.params);
      if (!parsedParams.success) {
        throw new AppError("Invalid concert ID format.", 400);
      }
      const concertId = parsedParams.data.concertId;

      const result = await TicketService.getTicketsByConcertId(concertId);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("Error fetching tickets by concert ID:", error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
};
