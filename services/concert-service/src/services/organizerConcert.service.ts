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
import db from "../db/knex.js";

export const OrganizerConcertService = {
  async createConcert(input: CreateConcertInput, organizerId: string) {
    try {
      let ticketTypeResults: {
        id: string;
        name: string;
        totalQuantity: number;
        maxPerUser: number;
      }[] = [];

      const concertId = crypto.randomUUID();

      await db.transaction(async (trx) => {
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

      return concertId;
    } catch (error) {
      console.error("Error creating concert:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create concert", 500);
    }
  },

  async updateConcert(concertId: string, updateData: UpdateConcertInput) {
    try {
      const existingConcert = await ConcertRepository.findConcertById(concertId);
      if (!existingConcert) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      if (existingConcert.status === "PUBLISHED") {
        throw new AppError("Cannot update a published concert", 400);
      }

      await db.transaction(async (trx) => {
        await ConcertRepository.updateConcert(trx, concertId, updateData);

        if (updateData.ticketTypes) {
          await ConcertRepository.deleteTicketTypes(trx, concertId);
          await ConcertRepository.createTicketType(trx, concertId, updateData.ticketTypes);
        }
      });

      await Promise.all([
        deleteKeysByPattern(`catalog:concerts:page:*`),
        safeRedisDel([
          detailKey(concertId),
          ticketsKey(concertId),
          stockKey(concertId),
          ticketLimitationKey(concertId, "*"),
        ]),
      ]);
    } catch (error) {
      console.error("Error updating concert:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update concert", 500);
    }
  },
  async updateConcertStatus(concertId: string, status: "DRAFT" | "PUBLISHED" | "CANCELLED") {
    try {
      const existingConcert = await ConcertRepository.findConcertById(concertId);
      if (!existingConcert) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      if (existingConcert.status === status) {
        throw new AppError(`Concert is already in ${status} status`, 400);
      }

      await ConcertRepository.updateConcertStatus(db, concertId, status);

      await Promise.all([
        deleteKeysByPattern(`catalog:concerts:page:*`),
        safeRedisDel([detailKey(concertId), ticketsKey(concertId)]),
      ]);

      return { concert_id: concertId, status };
    } catch (error) {
      throw error;
    }
  },
};
