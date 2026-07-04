import { parse } from "csv-parse";
import { AppError } from "../types/appError.types.js";
import { ConcertRepository } from "../repository/concert.repository.js";
import { VipRepository } from "../repository/vip.repository.js";

export const OrganizerVipService = {
  async importVipGuests(concertId: string, csvBuffer: Buffer) {
    try {
      const concertExists = await ConcertRepository.findConcertById(concertId);
      if (!concertExists) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      const records: { full_name: string; email: string; sponsor: string; concert_id: string }[] = [];
      const parser = parse(csvBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      for await (const record of parser) {
        records.push({
          full_name: record.full_name,
          email: record.email,
          sponsor: record.sponsor,
          concert_id: concertId,
        });
      }

      // Validate each record
      for (const record of records) {
        if (!record.full_name || !record.email || !record.sponsor) {
          throw new AppError("CSV file must contain full_name, email, and sponsor columns", 400);
        }
      }

      await VipRepository.insertVipGuests(records);
    } catch (error) {
      throw error;
    }
  },

  async getVipGuests(concertId: string, page: number, limit: number) {
    try {
      const concertExists = await ConcertRepository.findConcertById(concertId);
      if (!concertExists) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      const offset = (page - 1) * limit;

      const vipGuests = await VipRepository.getVipGuestsByConcertId(concertId, offset, limit);
      const totalCount = await VipRepository.countVipGuestsByConcertId(concertId);
      return { vipGuests, totalCount };
    } catch (error) {
      throw error;
    }
  },

  async checkInVipGuest(concertId: string, vipGuestId: string) {
    try {
      const concertExists = await ConcertRepository.findConcertById(concertId);
      if (!concertExists) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      const vipGuest = await VipRepository.findVipGuestByIdAndConcertId(vipGuestId, concertId);
      if (!vipGuest) {
        throw new AppError(`VIP Guest with ID ${vipGuestId} does not exist for concert ID ${concertId}`, 404);
      }

      if (vipGuest.checkedInAt) {
        throw new AppError(`VIP Guest with ID ${vipGuestId} has already been checked in`, 400);
      }

      await VipRepository.updateVipGuestCheckInStatus(vipGuestId, new Date());
    } catch (error) {
      throw error;
    }
  },
};
