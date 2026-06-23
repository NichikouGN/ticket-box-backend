import type { Knex } from "knex";
import db from "../db/knex.js";
import type { CreateConcertInput, TicketTypeInput, UpdateConcertInput } from "../types/concert.types.js";

type DB = Knex | Knex.Transaction;
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
      .where("c.status", "PUBLISHED")
      .andWhere("c.event_date", ">=", db.fn.now())
      .first();

    return Number(result?.count ?? 0);
  },
  async getPublishedConcerts(offset: number, limit: number) {
    return db("concerts as c")
      .leftJoin("artists as a", "a.concert_id", "c.id")
      .select([...concertColumns, artistAggregation])
      .where("c.status", "PUBLISHED")
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

  async getConcertDetail(concertId: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    artist: string;
    venue: string;
    event_date: Date;
    cover_image: string | null;
    seat_map_svg_url: string | null;
    status: "DRAFT" | "PUBLISHED" | "CANCELLED";
    artists: string[];
  } | null> {
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
      .select("tt.id", "tt.name", "tt.price", "tt.total_quantity", "tt.max_per_user", "tt.sold_quantity")
      .where("tt.concert_id", concertId)
      .orderBy("tt.price", "asc");
  },

  async getConcertTicketsDetails(concertId: string) {
    const concert = await this.getConcertDetail(concertId);

    if (!concert) {
      return null;
    }

    const ticketTypes = await this.getTicketTypes(concertId);

    return { concert, ticketTypes };
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
      cover_image: concert.thumbnailUrl ?? null,
      seat_map_svg_url: concert.seatMapSvgUrl ?? null,
      status: "PUBLISHED",
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

  async findArtistAndConcertById(concertId: string, artistIds: string[]): Promise<string[]> {
    return await db("concerts_artists")
      .where({ concert_id: concertId })
      .whereIn("artist_id", artistIds)
      .returning("artist_id")
      .first();
  },

  async createArtist(name: string) {
    const [result] = await db("artists").insert({ name }).returning("*");
    return result;
  },

  async findArtistByName(name: string): Promise<{ id: string; name: string } | null> {
    return await db("artists").where("name", name).first();
  },

  async linkArtistsToConcert(concertId: string, artistIds: string[]) {
    const dbRecords = artistIds.map((artistId) => ({
      concert_id: concertId,
      artist_id: artistId,
    }));

    await db("concerts_artists").insert(dbRecords).onConflict(["concert_id", "artist_id"]).ignore();
  },
};
