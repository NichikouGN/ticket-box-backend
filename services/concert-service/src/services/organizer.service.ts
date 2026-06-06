import { AppError } from "../types/appError.types.js";
import { ConcertRepository } from "../repository/concert.repository.js";
import type { CreateConcertInput, UpdateConcertInput } from "../types/concert.types.js";
import {
  deleteKeysByPattern,
  detailKey,
  safeRedisDel,
  safeRedisHSet,
  stockKey,
  ticketsKey,
} from "../utils/redis.utils.js";
import { notificationQueue } from "../queues/notification.queue.js";

export const OrganizerService = {
  async createConcert(input: CreateConcertInput, organizerId: string) {
    const result = await ConcertRepository.createConcert(
      {
        concert: input,
        artists: input.artists,
        ticketTypes: input.ticket_types,
      },
      organizerId,
    );

    await Promise.all(
      result.ticketTypes.map((ticketType) =>
        safeRedisHSet(
          stockKey(result.concertId),
          { [ticketType.id]: String(ticketType.total_quantity) },
          24 * 60 * 60,
        ),
      ),
    );

    await deleteKeysByPattern("catalog:concerts:page:*");
    await safeRedisDel([detailKey(result.concertId), ticketsKey(result.concertId)]);

    return { concert_id: result.concertId };
  },

  async updateConcert(concertId: string, input: UpdateConcertInput) {
    const result = await ConcertRepository.updateConcert(concertId, input);
    if (!result) {
      throw new AppError("Concert not found", 404);
    }

    const invalidationKeys = [detailKey(concertId), ticketsKey(concertId), stockKey(concertId)];

    await safeRedisDel(invalidationKeys);
    await deleteKeysByPattern("catalog:concerts:page:*");

    return null;
  },

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
