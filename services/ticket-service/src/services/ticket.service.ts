import { TicketRepository } from "../repository/ticket.repository.js";
import db from "../db/knex.js";
import { AppError } from "../types/appError.types.js";
import crypto from "crypto";
import dotenv from "dotenv";
import { concertClient } from "../clients/concert.client.js";

dotenv.config();

const PRIVATE_KEY = process.env.ED25519_PRIVATE_KEY!.replace(/\\n/g, "\n");
const PUBLIC_KEY = process.env.ED25519_PUBLIC_KEY!.replace(/\\n/g, "\n");

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

  async getTickets(page: number, limit: number, userId?: string) {
    if (!userId) {
      throw new AppError("User ID is required to fetch tickets.", 400);
    }

    const offset = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      TicketRepository.findTicketsByUserId(db, offset, limit, userId),
      TicketRepository.countTicketsByUserId(db, userId),
    ]);

    const concertMap = new Map<
      string,
      {
        id: string;
        title: string;
        venue: string;
        eventDate: string;
      } | null
    >();

    const ticketMap = new Map<string, string | null>();

    for (const ticket of tickets) {
      if (!concertMap.has(ticket.concertId)) {
        concertMap.set(ticket.concertId, null);
      }

      if (!ticketMap.has(ticket.ticketTypeId)) {
        ticketMap.set(ticket.ticketTypeId, null);
      }
    }

    await Promise.all([
      await Promise.all(
        [...ticketMap.keys()].map(async (ticketId) => {
          try {
            const response = await concertClient.get(`/concerts/ticket-types/${ticketId}`);
            const ticketDetails = response.data.data as {
              id: string;
              name: string;
            };
            ticketMap.set(ticketId, ticketDetails.name);
          } catch (error) {
            console.error(`Error fetching ticket details for ticket ID ${ticketId}:`, error);
            ticketMap.set(ticketId, null);
          }
        }),
      ),

      await Promise.all(
        [...concertMap.keys()].map(async (concertId) => {
          try {
            const response = await concertClient.get(`/concerts/${concertId}`);
            const concertDetails = response.data.data;
            concertMap.set(concertId, {
              id: concertDetails.id,
              title: concertDetails.title,
              venue: concertDetails.venue,
              eventDate: concertDetails.eventDate,
            });
          } catch (error) {
            console.error(`Error fetching concert details for concert ID ${concertId}:`, error);
            concertMap.set(concertId, null);
          }
        }),
      ),
    ]);

    const populatedTickets = tickets.map((ticket) => {
      const concertDetails = concertMap.get(ticket.concertId);
      const ticketName = ticketMap.get(ticket.ticketTypeId);
      return {
        ...ticket,
        ticketName: ticketName || null,
        concertDetails: concertDetails || null,
      };
    });

    return {
      data: populatedTickets,
      total: {
        total,
        page,
        limit,
      },
    };
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
        status: ticket.status,
      },
      signature: signature.toString("base64"),
    };
  },

  async getTicketsByConcertId(concertId: string) {
    if (!concertId) {
      throw new AppError("Concert ID is required to fetch tickets.", 400);
    }
    const tickets = await TicketRepository.findTicketsByConcertId(db, concertId);

    const ticketMap = new Map<string, string | null>();

    for (const ticket of tickets) {
      if (!ticketMap.has(ticket.ticketTypeId)) {
        ticketMap.set(ticket.ticketTypeId, null);
      }
    }

    await Promise.all(
      [...ticketMap.keys()].map(async (ticketId) => {
        try {
          const response = await concertClient.get(`/concerts/ticket-types/${ticketId}`);
          const ticketDetails = response.data.data as {
            id: string;
            name: string;
          };
          ticketMap.set(ticketId, ticketDetails.name);
        } catch (error) {
          console.error(`Error fetching ticket details for ticket ID ${ticketId}:`, error);
          ticketMap.set(ticketId, null);
        }
      }),
    );

    const populatedTickets = tickets.map((ticket) => {
      const ticketName = ticketMap.get(ticket.ticketTypeId);
      return {
        ...ticket,
        ticketName: ticketName || null,
      };
    });

    return populatedTickets;
  },

  async verifyTicket(ticketData: { ticketId: string; userId: string; concertId: string; ticketTypeId: string }) {
    try {
      if (!ticketData) {
        throw new AppError("Ticket data is required for verification.", 400);
      }

      const ticket = await TicketRepository.findTicketById(db, ticketData.ticketId);

      if (!ticket) {
        throw new AppError("Ticket not found.", 404);
      }

      if (ticket.status === "USED") {
        throw new AppError("Ticket has already been used.", 409);
      }

      if (
        ticket.ticketId !== ticketData.ticketId ||
        ticket.userId !== ticketData.userId ||
        ticket.concertId !== ticketData.concertId ||
        ticket.ticketTypeId !== ticketData.ticketTypeId
      ) {
        throw new AppError("Ticket data does not match.", 400);
      }

      return "Ticket verified successfully.";
    } catch (error) {
      throw error;
    }
  },

  async markTicketAsUsed(ticketId: string, staffId?: string) {
    try {
      if (!ticketId) {
        throw new AppError("Ticket ID is required to mark ticket as used.", 400);
      }

      if (!staffId) {
        throw new AppError("Staff ID is required to mark ticket as used.", 400);
      }

      const ticket = await TicketRepository.findTicketById(db, ticketId);

      if (!ticket) {
        throw new AppError("Ticket not found.", 404);
      }

      if (ticket.status === "USED") {
        throw new AppError("Ticket has already been used.", 409);
      }

      await TicketRepository.markTicketAsUsed(db, ticketId, staffId);
    } catch (error) {
      throw error;
    }
  },

  async getCheckinStats(concertId: string) {
    try {
      if (!concertId) {
        throw new AppError("Concert ID is required to fetch check-in stats.", 400);
      }
      const tickets = await TicketRepository.getCheckinStats(db, concertId);

      if (!tickets || tickets.length === 0) {
        throw new AppError("No tickets found for the given concert ID.", 404);
      }

      const totalTickets = tickets.length;
      const checkedInTickets = tickets.filter((ticket) => ticket.status === "USED").length;

      return {
        totalTickets,
        checkedInTickets,
        remainingTickets: totalTickets - checkedInTickets,
      };
    } catch (error) {
      throw error;
    }
  },
};
