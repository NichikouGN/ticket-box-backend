import db from "../db/knex.js";
export const OutboxRepository = {
  async updateEventStatus(eventId: string, status: string) {
    const result = await db("outbox_events")
      .where({ id: eventId })
      .update({ status })
      .returning("*");

    return result[0];
  },
};
