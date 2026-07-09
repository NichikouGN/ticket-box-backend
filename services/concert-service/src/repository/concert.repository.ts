import type { Knex } from "knex";
import db from "../db/knex.js";
import type { CreateConcertInput, TicketTypeInput, UpdateConcertInput } from "../types/concert.types.js";
import type { AIResponse } from "../types/artist.types.js";

type DB = Knex | Knex.Transaction;
const concertColumns = [
  "c.id",
  "c.title",
  "c.description",
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
  async getTicketNameByType(ticketTypeId: string): Promise<{
    id: string;
    name: string;
  } | null> {
    return await db("ticket_types").select("id", "name").where("id", ticketTypeId).first();
  },

  async updateConcert(db: DB, concertId: string, concert: UpdateConcertInput) {
    const updateData: Record<string, any> = {};

    if (concert.title !== undefined) updateData.title = concert.title;
    if (concert.description !== undefined) updateData.description = concert.description;
    if (concert.venue !== undefined) updateData.venue = concert.venue;
    if (concert.eventDate !== undefined) updateData.event_date = concert.eventDate;
    if (concert.coverImage !== undefined) updateData.cover_image = concert.coverImage ?? null;
    if (concert.seatMapSvg !== undefined) updateData.seat_map_svg_url = concert.seatMapSvg ?? null;

    await db("concerts").where("id", concertId).update(updateData);
  },

  async deleteTicketTypes(db: DB, concertId: string) {
    await db("ticket_types").where("concert_id", concertId).del();
  },

  async findConcertById(concertId: string): Promise<{
    id: string;
    status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  } | null> {
    return db("concerts").where("id", concertId).select(["id", "status"]).first();
  },

  async countAllConcerts() {
    const result = await db("concerts as c").count<{ count: string }>({ count: "c.id" }).first();
    return Number(result?.count ?? 0);
  },

  async getAllConcerts(offset: number, limit: number) {
    return db("concerts as c")
      .leftJoin("concerts_artists as ca", "ca.concert_id", "c.id")
      .leftJoin("artists as a", "a.id", "ca.artist_id")
      .select([...concertColumns, artistAggregation])
      .groupBy(
        "c.id",
        "c.title",
        "c.description",
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
      .where("c.status", "PUBLISHED")
      .andWhere("c.event_date", ">=", db.fn.now())
      .first();

    return Number(result?.count ?? 0);
  },
  async getPublishedConcerts(offset: number, limit: number) {
    return (
      db("concerts as c")
        .leftJoin("concerts_artists as ca", "ca.concert_id", "c.id")
        .leftJoin("artists as a", "a.id", "ca.artist_id")
        .select([...concertColumns, artistAggregation])
        .where("c.status", "PUBLISHED")
        // .andWhere("c.event_date", ">=", db.fn.now())
        .groupBy(
          "c.id",
          "c.title",
          "c.description",
          "c.venue",
          "c.event_date",
          "c.cover_image",
          "c.seat_map_svg_url",
          "c.status",
        )
        .orderBy("c.event_date", "asc")
        .limit(limit)
        .offset(offset)
    );
  },

  async getConcertDetail(concertId: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    venue: string;
    eventDate: Date;
    coverImage: string | null;
    seatMapSvg: string | null;
    status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  } | null> {
    const concert = await db("concerts as c")
      .leftJoin("concerts_artists as ca", "ca.concert_id", "c.id")
      .leftJoin("artists as a", "a.id", "ca.artist_id")
      .select([...concertColumns])
      .where("c.id", concertId)
      .groupBy(
        "c.id",
        "c.title",
        "c.description",
        "c.venue",
        "c.event_date",
        "c.cover_image",
        "c.seat_map_svg_url",
        "c.status",
      )
      .first();
    if (!concert) {
      return null;
    }
    return {
      id: concert.id,
      title: concert.title,
      description: concert.description,
      venue: concert.venue,
      eventDate: new Date(concert.event_date),
      coverImage: concert.cover_image,
      seatMapSvg: concert.seat_map_svg_url,
      status: concert.status as "DRAFT" | "PUBLISHED" | "CANCELLED",
    };
  },

  async getTicketTypes(concertId: string): Promise<
    {
      id: string;
      name: string;
      price: number;
      totalQuantity: number;
      maxPerUser: number;
      soldQuantity: number;
    }[]
  > {
    const rows = await db("ticket_types")
      .select("id", "name", "price", "total_quantity", "max_per_user", "sold_quantity")
      .where("concert_id", concertId)
      .orderBy("price", "asc");

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      totalQuantity: Number(row.total_quantity),
      maxPerUser: Number(row.max_per_user),
      soldQuantity: Number(row.sold_quantity),
    }));
  },

  async getTicketTypesByIds(
    concertId: string,
    ticketTypeIds: string[],
  ): Promise<
    {
      id: string;
      name: string;
      price: number;
      total_quantity: number;
      max_per_user: number;
      sold_quantity: number;
    }[]
  > {
    return db("ticket_types as tt")
      .select("tt.id", "tt.name", "tt.price", "tt.total_quantity", "tt.max_per_user", "tt.sold_quantity")
      .where("tt.concert_id", concertId)
      .whereIn("tt.id", ticketTypeIds)
      .orderBy("tt.price", "asc");
  },

  async createConcert(
    db: Knex | Knex.Transaction,
    organizerId: string,
    concertId: string,
    concert: Omit<CreateConcertInput, "ticketTypes">,
  ) {
    await db("concerts").insert({
      id: concertId,
      organizer_id: organizerId,
      title: concert.title,
      description: concert.description ?? null,
      venue: concert.venue,
      event_date: concert.eventDate,
      cover_image: concert.coverImage ?? null,
      seat_map_svg_url: concert.seatMapSvg ?? null,
      status: "DRAFT",
    });
  },

  async createTicketType(
    db: Knex | Knex.Transaction,
    concertId: string,
    ticketTypes: TicketTypeInput[],
  ): Promise<
    {
      id: string;
      name: string;
      totalQuantity: number;
      maxPerUser: number;
    }[]
  > {
    const dbRecords = ticketTypes.map((ticketType) => ({
      concert_id: concertId,
      name: ticketType.name,
      price: ticketType.price,
      total_quantity: ticketType.totalCapacity,
      max_per_user: ticketType.maxPerUser,
      sold_quantity: 0,
    }));

    const results = await db("ticket_types")
      .insert(dbRecords)
      .returning(["id", "name", "total_quantity", "max_per_user"]);

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      totalQuantity: result.total_quantity,
      maxPerUser: result.max_per_user,
    }));
  },

  async updateConcertStatus(
    db: Knex | Knex.Transaction,
    concertId: string,
    status: "DRAFT" | "PUBLISHED" | "CANCELLED",
  ) {
    await db("concerts").where("id", concertId).update({ status });
  },
};
