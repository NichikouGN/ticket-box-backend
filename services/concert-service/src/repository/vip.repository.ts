import db from "../db/knex.js";
export const VipRepository = {
  async insertVipGuests(records: { full_name: string; email: string; sponsor: string; concert_id: string }[]) {
    try {
      const insertedRecords = await db("vip_guests").insert(records).returning("*");
      return insertedRecords;
    } catch (error) {
      throw error;
    }
  },
  async findVipGuestByIdAndConcertId(
    vipGuestId: string,
    concertId: string,
  ): Promise<{
    id: string;
    fullName: string;
    email: string;
    sponsor: string;
    concertId: string;
    checkedInAt: Date | null;
  } | null> {
    try {
      const vipGuest = await db("vip_guests").where({ id: vipGuestId, concert_id: concertId }).first();

      if (!vipGuest) {
        return null;
      }

      return {
        id: vipGuest.id,
        fullName: vipGuest.full_name,
        email: vipGuest.email,
        sponsor: vipGuest.sponsor,
        concertId: vipGuest.concert_id,
        checkedInAt: vipGuest.checked_in_at,
      };
    } catch (error) {
      throw error;
    }
  },

  async countVipGuestsByConcertId(concertId: string): Promise<number> {
    try {
      const result = await db("vip_guests")
        .where("concert_id", concertId)
        .count<{ count: string }>("id as count")
        .first();
      return result ? parseInt(result.count, 10) : 0;
    } catch (error) {
      throw error;
    }
  },

  async getVipGuestsByConcertId(
    concertId: string,
    offset: number,
    limit: number,
  ): Promise<{ fullName: string; email: string; sponsor: string; concertId: string; checkedInAt: Date | null }[]> {
    try {
      const vipGuests = await db("vip_guests")
        .where("concert_id", concertId)
        .offset(offset)
        .limit(limit)
        .orderBy("imported_at", "desc");

      return vipGuests.map((guest) => ({
        fullName: guest.full_name,
        email: guest.email,
        sponsor: guest.sponsor,
        concertId: guest.concert_id,
        checkedInAt: guest.checked_in_at,
      }));
    } catch (error) {
      throw error;
    }
  },

  async updateVipGuestCheckInStatus(vipGuestId: string, checkInTime: Date): Promise<void> {
    try {
      await db("vip_guests").where("id", vipGuestId).update({ checked_in_at: checkInTime });
    } catch (error) {
      throw error;
    }
  },
};
