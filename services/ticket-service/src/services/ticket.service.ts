import { TicketRepository } from "../repository/ticket.repository.js";
import db from "../db/knex.js";
import { AppError } from "../types/appError.types.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.ED25519_PRIVATE_KEY;
const PUBLIC_KEY = process.env.ED25519_PUBLIC_KEY;
if (!PRIVATE_KEY) {
  throw new Error("ED25519_PRIVATE_KEY is not defined in environment variables.");
}
if (!PUBLIC_KEY) {
  throw new Error("ED25519_PUBLIC_KEY is not defined in environment variables.");
}

export const TicketService = {
  async getPublicKey() {
    return PUBLIC_KEY;
  },

  async getTickets(userId?: string) {
    if (!userId) {
      throw new AppError("User ID is required to fetch tickets.", 400);
    }
    const tickets = await TicketRepository.findTicketsByUserId(db, userId);
    return tickets;
  },

  async getTicketById(ticketId: string): Promise<{
    ticket: {
      ticketId: string;
      userId: string;
      concertId: string;
      ticketTypeId: string;
    };
    signature: string;
  }> {
    if (!ticketId) {
      throw new AppError("Ticket ID is required to fetch ticket details.", 400);
    }
    const ticket = await TicketRepository.findTicketById(db, ticketId);

    if (!ticket) {
      throw new AppError("Ticket not found.", 404);
    }

    const payloadString = JSON.stringify(ticket);
    const signature = crypto.sign(null, Buffer.from(payloadString), PRIVATE_KEY);

    return {
      ticket: {
        ticketId: ticket.ticketId,
        userId: ticket.userId,
        concertId: ticket.concertId,
        ticketTypeId: ticket.ticketTypeId,
      },
      signature: signature.toString("base64"),
    };
  },

  async getTicketsByConcertId(concertId: string) {
    if (!concertId) {
      throw new AppError("Concert ID is required to fetch tickets.", 400);
    }
    const tickets = await TicketRepository.findTicketsByConcertId(db, concertId);
    return tickets;
  },

  async verifyTicket(ticketData: {
    ticketId: string;
    userId: string;
    concertId: string;
    ticketTypeId: string;
  }) {
    if (!ticketData) {
      throw new AppError("Ticket data is required for verification.", 400);
    }

    const ticket = await TicketRepository.findTicketById(db, ticketData.ticketId);
    if (!ticket) {
      throw new AppError("Ticket not found.", 404);
    }

    if (
      ticket.ticketId !== ticketData.ticketId ||
      ticket.userId !== ticketData.userId ||
      ticket.concertId !== ticketData.concertId ||
      ticket.ticketTypeId !== ticketData.ticketTypeId
    ) {
      throw new AppError("Ticket data does not match.", 400);
    }

    return { message: "Ticket verified successfully." };
  },

  async getCheckinStats(concertId: string) {
    if (!concertId) {
      throw new AppError("Concert ID is required to fetch check-in stats.", 400);
    }
    const tickets = await TicketRepository.getCheckinStats(db, concertId);
    const totalTickets = tickets.length;
    const checkedInTickets = tickets.filter((ticket) => ticket.status === "USED").length;

    return {
      totalTickets,
      checkedInTickets,
      remainingTickets: totalTickets - checkedInTickets,
    };
  },
};
