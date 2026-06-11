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
  /**
   * Creates a new concert with the provided details
   * @param input input data for creating a concert
   * @param organizerId ID of the organizer creating the concert
   * @returns Promise resolving to the result of the creation or an error if the creation fails
   * @throws AppError with status 400 for invalid input data
   * @throws AppError with status 401 for unauthorized access
   * @throws AppError with status 500 for any unexpected errors during creation
   */
  async createConcert(input: CreateConcertInput, organizerId: string) {
    const result = await ConcertRepository.createConcert(
      {
        concert: input,
        artists: input.artists,
        ticketTypes: input.ticketTypes,
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

  /**
   * Updates an existing concert with the provided details
   * @param concertId ID of the concert to update
   * @param input input data for updating the concert
   * @returns Promise resolving to the result of the update or an error if the update fails
   * @throws AppError with status 400 for invalid input data
   * @throws AppError with status 404 if the concert is not found
   * @throws AppError with status 500 for any unexpected errors during update
   */
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

  /**
   * Cancels an existing concert with the provided details
   * @param concertId ID of the concert to cancel
   * @param organizerId ID of the organizer canceling the concert
   * @param reason Optional reason for cancellation
   * @returns Promise resolving to the result of the cancellation or an error if the cancellation fails
   * @throws AppError with status 404 if the concert is not found
   * @throws AppError with status 400 if the concert is not published
   * @throws AppError with status 500 for any unexpected errors during cancellation
   */
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

  /**
   * Publishes an existing concert with the provided details
   * @param concertId ID of the concert to publish
   * @param organizerId ID of the organizer publishing the concert
   * @returns Promise resolving to the result of the publication or an error if the publication fails
   * @throws AppError with status 404 if the concert is not found
   * @throws AppError with status 400 if the concert is not in draft status
   * @throws AppError with status 500 for any unexpected errors during publication
   */
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

  /**
   * Restores an existing concert with the provided details
   * @param concertId ID of the concert to restore
   * @param organizerId ID of the organizer restoring the concert
   * @returns Promise resolving to the result of the restoration or an error if the restoration fails
   * @throws AppError with status 404 if the concert is not found
   * @throws AppError with status 400 if the concert is not in cancelled status
   * @throws AppError with status 500 for any unexpected errors during restoration
   */
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
