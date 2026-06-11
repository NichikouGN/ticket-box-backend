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
  async countAllConcerts() {
    const result = await db("concerts as c").count<{ count: string }>({ count: "c.id" }).first();
    return Number(result?.count ?? 0);
  },

  async getAllConcerts(offset: number, limit: number) {
    return db("concerts as c")
      .leftJoin("artists as a", "a.concert_id", "c.id")
      .select([...concertColumns, artistAggregation])
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

  async countPublishedConcerts() {
    const result = await db("concerts as c")
      .count<{ count: string }>({ count: "c.id" })
      .where("c.status", "published")
      .andWhere("c.event_date", ">=", db.fn.now())
      .first();

    return Number(result?.count ?? 0);
  },
  async getPublishedConcerts(offset: number, limit: number) {
    return db("concerts as c")
      .leftJoin("artists as a", "a.concert_id", "c.id")
      .select([...concertColumns, artistAggregation])
      .where("c.status", "published")
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

  // async getConcertWithTickets(concertId: string) {
  // const concert = await this.getConcertDetail(concertId);
  // if (!concert) {
  // return null;
  // }
  //
  // const ticketTypes = await this.getTicketTypes(concertId);
  // return { concert, ticketTypes };
  // },

  async getConcertTicketsDetails(concertId: string) {
    const concert = await this.getConcertDetail(concertId);

    if (!concert) {
      return null;
    }

    const ticketTypes = await this.getTicketTypes(concertId);

    console.log("Fetched concert and ticket types from DB:", { concert, ticketTypes });
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
          event_date: input.concert.eventDate,
          cover_image: input.concert.thumbnailUrl ?? null,
          seat_map_svg_url: input.concert.seatMapSvgUrl ?? null,
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
            total_quantity: ticketType.totalCapacity,
            max_per_user: ticketType.maxPerUser,
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
      if (updates.eventDate !== undefined) concertPatch.event_date = updates.eventDate;
      if (updates.thumbnailUrl !== undefined)
        concertPatch.cover_image = updates.thumbnailUrl ?? null;
      if (updates.seatMapSvgUrl !== undefined)
        concertPatch.seat_map_svg_url = updates.seatMapSvgUrl ?? null;

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

      if (updates.ticketTypes !== undefined) {
        const existingTicketTypes = await trx("ticket_types")
          .select("id")
          .where("concert_id", concertId);
        replacedTicketTypeIds = existingTicketTypes.map(
          (ticketType: { id: string }) => ticketType.id,
        );
        await trx("ticket_types").where("concert_id", concertId).del();

        if (updates.ticketTypes.length > 0) {
          await trx("ticket_types").insert(
            updates.ticketTypes.map((ticketType) => ({
              concert_id: concertId,
              name: ticketType.name,
              price: ticketType.price,
              total_quantity: ticketType.totalCapacity,
              max_per_user: ticketType.maxPerUser,
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

  async publishConcert(concertId: string, organizerId: string) {
    return db.transaction(async (trx) => {
      const concert = await trx("concerts").where("id", concertId).first();
      if (!concert) {
        return null;
      }

      if (concert.status !== "draft") {
        return { updated: false };
      }

      await trx("concerts").where("id", concertId).update({ status: "published" });
      await trx("audit_logs").insert({
        actor_id: organizerId,
        action: "PUBLISH_CONCERT",
        target_type: "concert",
        target_id: concertId,
        old_value: trx.raw("?::jsonb", [JSON.stringify({ status: concert.status })]),
        new_value: trx.raw("?::jsonb", [JSON.stringify({ status: "published" })]),
      });

      return { updated: true };
    });
  },

  async restoreConcert(concertId: string, organizerId: string) {
    return db.transaction(async (trx) => {
      const concert = await trx("concerts").where("id", concertId).first();
      if (!concert) {
        return null;
      }

      if (concert.status !== "cancelled") {
        return { updated: false };
      }

      await trx("concerts").where("id", concertId).update({ status: "published" });
      await trx("audit_logs").insert({
        actor_id: organizerId,
        action: "RESTORE_CONCERT",
        target_type: "concert",
        target_id: concertId,
        old_value: trx.raw("?::jsonb", [JSON.stringify({ status: concert.status })]),
        new_value: trx.raw("?::jsonb", [JSON.stringify({ status: "published" })]),
      });

      return { updated: true };
    });
  },
};
