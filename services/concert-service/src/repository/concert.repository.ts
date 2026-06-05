import db from "../db/knex.js";
import type {
  CreateConcertInput,
  TicketTypeInput,
  UpdateConcertInput,
} from "../types/concert.types.js";

const concertColumns = [
  "c.id",
  "c.title",
  "c.description",
  "c.artist",
  "c.venue",
  "c.event_date",
  "c.cover_image",
  "c.seat_map_svg_url",
  "c.status",
];

const artistAggregation = db.raw(
  "COALESCE(json_agg(DISTINCT a.name) FILTER (WHERE a.id IS NOT NULL), '[]') AS artists",
);

export const ConcertRepository = {
  async countUpcomingConcerts() {
    const result = await db("concerts as c")
      .count<{ count: string }>({ count: "c.id" })
      .whereIn("c.status", ["upcoming", "published"])
      .andWhere("c.event_date", ">=", db.fn.now())
      .first();

    return Number(result?.count ?? 0);
  },

  async getUpcomingConcerts(offset: number, limit: number) {
    return db("concerts as c")
      .leftJoin("artists as a", "a.concert_id", "c.id")
      .select([...concertColumns, artistAggregation])
      .whereIn("c.status", ["upcoming", "published"])
      .andWhere("c.event_date", ">=", db.fn.now())
      .groupBy(
        "c.id",
        "c.title",
        "c.description",
        "c.artist",
        "c.venue",
        "c.event_date",
        "c.cover_image",
        "c.seat_map_svg_url",
        "c.status",
      )
      .orderBy("c.event_date", "asc")
      .limit(limit)
      .offset(offset);
  },

  async getConcertDetail(concertId: string) {
    return db("concerts as c")
      .leftJoin("artists as a", "a.concert_id", "c.id")
      .select([...concertColumns, artistAggregation])
      .where("c.id", concertId)
      .groupBy(
        "c.id",
        "c.title",
        "c.description",
        "c.artist",
        "c.venue",
        "c.event_date",
        "c.cover_image",
        "c.seat_map_svg_url",
        "c.status",
      )
      .first();
  },

  async getTicketTypes(concertId: string) {
    return db("ticket_types as tt")
      .select(
        "tt.id",
        "tt.name",
        "tt.price",
        "tt.total_quantity",
        "tt.max_per_user",
        "tt.sold_quantity",
      )
      .where("tt.concert_id", concertId)
      .orderBy("tt.price", "asc");
  },

  async getConcertWithStock(concertId: string) {
    const concert = await this.getConcertDetail(concertId);

    if (!concert) {
      return null;
    }

    const ticketTypes = await this.getTicketTypes(concertId);
    return { concert, ticketTypes };
  },

  async createConcert(
    input: { concert: CreateConcertInput; artists: string[]; ticketTypes: TicketTypeInput[] },
    organizerId: string,
  ) {
    return db.transaction(async (trx) => {
      const insertedConcerts = await trx("concerts")
        .insert({
          organizer_id: organizerId,
          title: input.concert.title,
          description: input.concert.description ?? null,
          artist: input.concert.artists[0] ?? input.concert.title,
          venue: input.concert.venue,
          event_date: input.concert.start_time,
          cover_image: input.concert.thumbnail_url ?? null,
          seat_map_svg_url: input.concert.seat_map_svg_url ?? null,
          status: "published",
        })
        .returning<{ id: string }[]>("id");

      const concertId = insertedConcerts[0]?.id;
      if (!concertId) {
        throw new Error("Failed to create concert");
      }

      if (input.artists.length > 0) {
        await trx("artists").insert(
          input.artists.map((name) => ({
            concert_id: concertId,
            name,
          })),
        );
      }

      const insertedTicketTypes = await trx("ticket_types")
        .insert(
          input.ticketTypes.map((ticketType) => ({
            concert_id: concertId,
            name: ticketType.name,
            price: ticketType.price,
            total_quantity: ticketType.total_capacity,
            max_per_user: ticketType.max_per_user,
            sold_quantity: 0,
          })),
        )
        .returning<{ id: string; total_quantity: number }[]>(["id", "total_quantity"]);

      return {
        concertId,
        ticketTypes: insertedTicketTypes,
      };
    });
  },

  async updateConcert(concertId: string, updates: UpdateConcertInput) {
    return db.transaction(async (trx) => {
      const existingConcert = await trx("concerts").where("id", concertId).first();
      if (!existingConcert) {
        return null;
      }

      const concertPatch: Record<string, unknown> = {};
      if (updates.title !== undefined) concertPatch.title = updates.title;
      if (updates.description !== undefined) concertPatch.description = updates.description ?? null;
      if (updates.venue !== undefined) concertPatch.venue = updates.venue;
      if (updates.start_time !== undefined) concertPatch.event_date = updates.start_time;
      if (updates.thumbnail_url !== undefined)
        concertPatch.cover_image = updates.thumbnail_url ?? null;
      if (updates.seat_map_svg_url !== undefined)
        concertPatch.seat_map_svg_url = updates.seat_map_svg_url ?? null;

      if (Object.keys(concertPatch).length > 0) {
        await trx("concerts").where("id", concertId).update(concertPatch);
      }

      let replacedTicketTypeIds: string[] = [];

      if (updates.artists !== undefined) {
        await trx("artists").where("concert_id", concertId).del();
        if (updates.artists.length > 0) {
          await trx("artists").insert(
            updates.artists.map((name) => ({
              concert_id: concertId,
              name,
            })),
          );
        }
      }

      if (updates.ticket_types !== undefined) {
        const existingTicketTypes = await trx("ticket_types")
          .select("id")
          .where("concert_id", concertId);
        replacedTicketTypeIds = existingTicketTypes.map(
          (ticketType: { id: string }) => ticketType.id,
        );
        await trx("ticket_types").where("concert_id", concertId).del();

        if (updates.ticket_types.length > 0) {
          await trx("ticket_types").insert(
            updates.ticket_types.map((ticketType) => ({
              concert_id: concertId,
              name: ticketType.name,
              price: ticketType.price,
              total_quantity: ticketType.total_capacity,
              max_per_user: ticketType.max_per_user,
              sold_quantity: 0,
            })),
          );
        }
      }

      return {
        concertId,
        replacedTicketTypeIds,
      };
    });
  },

  async cancelConcert(concertId: string, organizerId: string, reason: string | null) {
    return db.transaction(async (trx) => {
      const concert = await trx("concerts").where("id", concertId).first();
      if (!concert) {
        return null;
      }

      if (concert.status !== "published") {
        return { updated: false };
      }

      await trx("concerts").where("id", concertId).update({ status: "cancelled" });
      await trx("audit_logs").insert({
        actor_id: organizerId,
        action: "CANCEL_CONCERT",
        target_type: "concert",
        target_id: concertId,
        old_value: trx.raw("?::jsonb", [JSON.stringify({ status: concert.status })]),
        new_value: trx.raw("?::jsonb", [JSON.stringify({ status: "cancelled" })]),
        reason,
      });

      return { updated: true };
    });
  },
};
