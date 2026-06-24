import db from "../db/knex.js";

export const ArtistRepository = {
  async findArtistAndConcertById(concertId: string, artistIds: string[]): Promise<string[]> {
    const results = await db("concerts_artists")
      .where({ concert_id: concertId })
      .whereIn("artist_id", artistIds)
      .returning("*");

    return results.map((r) => r.artist_id);
  },

  async createArtist(name: string) {
    const [result] = await db("artists").insert({ name }).returning("*");
    return result;
  },

  async findArtistByName(name: string): Promise<{ id: string; name: string } | null> {
    return await db("artists").where("name", name).first();
  },

  async findArtistByIds(artistIds: string[]): Promise<{ id: string; name: string }[]> {
    return await db("artists").whereIn("id", artistIds).select("id", "name");
  },

  async findArtistForBioGeneration(artistIds: string[], concertId: string): Promise<{ id: string; name: string }[]> {
    return await db("artists as a")
      .join("concerts_artists as ca", "a.id", "ca.artist_id")
      .where("ca.concert_id", concertId)
      .whereIn("a.id", artistIds)
      .whereIn("ca.bio_status", ["PENDING", "REJECTED"])
      .select("a.id", "a.name");
  },

  async linkArtistsToConcert(concertId: string, artistIds: string[]) {
    const dbRecords = artistIds.map((artistId) => ({
      concert_id: concertId,
      artist_id: artistId,
    }));

    await db("concerts_artists").insert(dbRecords).onConflict(["concert_id", "artist_id"]).ignore();
  },

  async updateArtistAIBios(
    concertId: string,
    matchedArtists: { trackingId: string; artistName: string; aiBio: string }[],
  ) {
    const updatePromises = matchedArtists.map((artist) =>
      db("concerts_artists")
        .where("artist_id", artist.trackingId)
        .where("concert_id", concertId)
        .update({ ai_bio: artist.aiBio, bio_status: "AWAITING_REVIEW" })
        .returning("*"),
    );

    await Promise.all(updatePromises);
  },

  async updateArtistApprovedBio(concertId: string, artistId: string) {
    await db("concerts_artists")
      .where("concert_id", concertId)
      .andWhere("artist_id", artistId)
      .update({ verified_bio: db.raw("ai_bio") });
  },

  async getAwaitingReviewBios(concertId: string): Promise<{ artistId: string; artistName: string; aiBio: string }[]> {
    const results = await db("concerts_artists as ca")
      .join("artists as a", "ca.artist_id", "a.id")
      .select("ca.artist_id", "ca.ai_bio", "a.name")
      .where("ca.concert_id", concertId)
      .andWhere("ca.bio_status", "AWAITING_REVIEW");

    return results.map((result) => ({
      artistId: result.artist_id,
      artistName: result.name,
      aiBio: result.ai_bio,
    }));
  },

  async updateArtistBioStatus(concertId: string, artistId: string, status: "APPROVED" | "REJECTED") {
    await db("concerts_artists")
      .where("concert_id", concertId)
      .andWhere("artist_id", artistId)
      .update({ bio_status: status });
  },
};
