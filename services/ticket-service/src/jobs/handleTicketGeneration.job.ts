import db from "../db/knex.js";

export const handleTicketGeneration = async (job: any) => {
  const { items, orderId } = job.data as {
    items: Array<{ userId: string; concertId: string; ticketTypeId: string; quantity: number }>;
    orderId: string;
  };

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const ticketId = crypto.randomUUID();
      await db("tickets").insert({
        id: ticketId,
        user_id: item.userId,
        order_id: orderId,
        concert_id: item.concertId,
        ticket_type_id: item.ticketTypeId,
        status: "UNUSED",
        created_at: db.fn.now(),
      });
    }
  }
};
