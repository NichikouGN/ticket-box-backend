import { AppError } from "../types/appError.types.js";
import { ConcertRepository } from "../repository/concert.repository.js";
import type { CreateConcertInput, UpdateConcertInput } from "../types/concert.types.js";
import {
  deleteKeysByPattern,
  detailKey,
  safeRedisDel,
  safeRedisHSet,
  stockKey,
  ticketLimitationKey,
  ticketsKey,
} from "../utils/redis.utils.js";
import { notificationQueue } from "../queues/notification.queue.js";
import db from "../db/knex.js";

type ArtistResult = {
  id: string;
  name: string;
};

export const OrganizerService = {
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

  // async updateConcert(concertId: string, input: UpdateConcertInput) {
  //   const result = await ConcertRepository.updateConcert(concertId, input);
  //   if (!result) {
  //     throw new AppError("Concert not found", 404);
  //   }

  //   const invalidationKeys = [detailKey(concertId), ticketsKey(concertId), stockKey(concertId)];

  //   await safeRedisDel(invalidationKeys);
  //   await deleteKeysByPattern("catalog:concerts:page:*");

  //   return null;
  // },

  async cancelConcert(concertId: string, organizerId: string, reason: string | null) {
    const result = await ConcertRepository.cancelConcert(concertId, organizerId, reason);
    if (!result) {
      throw new AppError("Concert not found", 404);
    }

    if (!result.updated) {
      throw new AppError("Concert must be published before it can be cancelled", 400);
    }

    await safeRedisDel([detailKey(concertId), ticketsKey(concertId), stockKey(concertId)]);
    await deleteKeysByPattern("catalog:concerts:page:*");

    try {
      await notificationQueue.add("concert-cancelled", {
        concertId,
        organizerId,
        reason,
      });
    } catch (error) {
      console.warn("Failed to enqueue cancellation notification job", error);
    }

    return null;
  },

  async publishConcert(concertId: string, organizerId: string) {
    const result = await ConcertRepository.publishConcert(concertId, organizerId);
    if (!result) {
      throw new AppError("Concert not found", 404);
    }

    if (!result.updated) {
      throw new AppError("Concert must be in draft status before it can be published", 400);
    }

    await safeRedisDel([detailKey(concertId), ticketsKey(concertId), stockKey(concertId)]);
    await deleteKeysByPattern("catalog:concerts:page:*");

    return null;
  },

  async restoreConcert(concertId: string, organizerId: string) {
    const result = await ConcertRepository.restoreConcert(concertId, organizerId);
    if (!result) {
      throw new AppError("Concert not found", 404);
    }

    if (!result.updated) {
      throw new AppError("Concert must be in cancelled status before it can be restored", 400);
    }

    await safeRedisDel([detailKey(concertId), ticketsKey(concertId), stockKey(concertId)]);
    await deleteKeysByPattern("catalog:concerts:page:*");

    return null;
  },
};
