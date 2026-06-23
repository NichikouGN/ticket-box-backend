import { AppError } from "../types/appError.types.js";
import { ConcertRepository } from "../repository/concert.repository.js";
import type { CreateConcertInput } from "../types/concert.types.js";
import {
  deleteKeysByPattern,
  detailKey,
  safeRedisDel,
  safeRedisHSet,
  stockKey,
  ticketLimitationKey,
  ticketsKey,
} from "../utils/redis.utils.js";
import db from "../db/knex.js";
import { OutboxRepository } from "../repository/outbox.repository.js";

type ArtistResult = {
  id: string;
  name: string;
};

export const OrganizerService = {
  async createConcert(input: CreateConcertInput, organizerId: string) {
    try {
      let ticketTypeResults: {
        id: string;
        name: string;
        totalQuantity: number;
        maxPerUser: number;
      }[] = [];

      const concertId = crypto.randomUUID();

      db.transaction(async (trx) => {
        await ConcertRepository.createConcert(trx, organizerId, concertId, input);
        ticketTypeResults = await ConcertRepository.createTicketType(trx, concertId, input.ticketTypes);
      });

      await Promise.all([
        ticketTypeResults.map((ticketType) => {
          safeRedisHSet(stockKey(concertId), { [ticketType.id]: String(ticketType.totalQuantity) }, 24 * 60 * 60);
          safeRedisHSet(
            ticketLimitationKey(concertId, ticketType.id),
            { maxPerUser: String(ticketType.maxPerUser) },
            24 * 60 * 60,
          );
        }),

        deleteKeysByPattern(`catalog:concerts:page:*`),
        safeRedisDel([detailKey(concertId), ticketsKey(concertId)]),
      ]);

      return { concert_id: concertId };
    } catch (error) {
      console.error("Error creating concert:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create concert", 500);
    }
  },

  async createArtists(name: string[]) {
    let result: ArtistResult[] = [];
    let existingArtists: ArtistResult[] = [];

    for (const artistName of name) {
      if (artistName.trim() === "") {
        throw new AppError("Artist names cannot be empty", 400);
      }

      const existingArtist = await ConcertRepository.findArtistByName(artistName);
      if (existingArtist) {
        existingArtists.push(existingArtist);
        continue;
      }
      const artist = await ConcertRepository.createArtist(artistName);
      result.push(artist);
    }

    return { existingArtists: [...existingArtists], newArtists: [...result] };
  },

  async linkArtistsToConcert(concertId: string, artistIds: string[]) {
    await ConcertRepository.linkArtistsToConcert(concertId, artistIds);
  },
  async generateArtistBios(
    concertId: string,
    artists: { id: string; name: string }[],
    pdfBase64String: string,
    mimeType: string,
  ) {
    try {
      const linkedIds = await ConcertRepository.findArtistAndConcertById(
        concertId,
        artists.map((artist) => artist.id),
      );

      if (!linkedIds || linkedIds.length !== artists.length) {
        const missingArtists = artists.filter((a) => !linkedIds?.includes(a.id) || false);
        throw new AppError(
          `The following artists are not associated with the concert ${concertId}: ${missingArtists.map((a) => `${a.id}: ${a.name}`).join(", ")}`,
          404,
        );
      }

      await OutboxRepository.createOrderOutboxEvent(
        db,
        "GENERATE_ARTIST_BIOS",
        {
          concertId: concertId,
          artists: artists,
          pdfBase64String: pdfBase64String,
          mimeType: mimeType,
        },
        300,
      ); // Retry after 300 seconds if processing fails
    } catch (error) {
      throw error;
    }
  },
};
