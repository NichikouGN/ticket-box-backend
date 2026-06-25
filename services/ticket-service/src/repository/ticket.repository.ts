import type { Knex } from "knex";

type DB = Knex | Knex.Transaction;
export const TicketRepository = {
  async findTicketsByUserId(
    db: DB,
    userId: string,
  ): Promise<
    {
      ticketId: string;
      concertId: string;
      ticketTypeId: string;
      status: string;
      createdAt: string;
      usedAt: string | null;
    }[]
  > {
    const results = await db("tickets")
      .where({ user_id: userId })
      .select("id", "concert_id", "ticket_type_id", "status", "created_at", "used_at");
    return results;
  },
  async findTicketById(
    db: DB,
    ticketId: string,
  ): Promise<{
    ticketId: string;
    userId: string;
    concertId: string;
    ticketTypeId: string;
    status: "UNUSED" | "USED";
    createdAt: string;
    usedAt: string | null;
  } | null> {
    const ticket = await db("tickets")
      .where({ id: ticketId })
      .select("id", "user_id", "concert_id", "ticket_type_id", "status", "created_at", "used_at")
      .first();

    if (!ticket) {
      return null;
    }

    return {
      ticketId: ticket?.id,
      userId: ticket?.user_id,
      concertId: ticket?.concert_id,
      ticketTypeId: ticket?.ticket_type_id,
      status: ticket?.status,
      createdAt: ticket?.created_at,
      usedAt: ticket?.used_at,
    };
  },
  async findTicketsByConcertId(
    db: DB,
    concertId: string,
  ): Promise<
    {
      ticketId: string;
      userId: string;
      ticketTypeId: string;
      status: string;
      createdAt: string;
      usedAt: string | null;
    }[]
  > {
    const tickets = await db("tickets")
      .where({ concert_id: concertId })
      .select("id", "user_id", "ticket_type_id", "status", "created_at", "used_at");
    return tickets;
  },

  async markTicketAsUsed(db: DB, ticketId: string, staffId: string) {
    await db("tickets").where({ id: ticketId }).update({
      status: "USED",
      used_at: db.fn.now(),
      used_by_staff: staffId,
    });
  },

  async getCheckinStats(
    db: DB,
    concertId: string,
  ): Promise<
    {
      ticketId: string;
      status: string;
    }[]
  > {
    const tickets = await db("tickets").where({ concert_id: concertId }).select("id", "status");
    return tickets;
  },
};
